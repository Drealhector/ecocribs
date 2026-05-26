import { v } from 'convex/values';
import { authedQuery, authedAction } from './lib/withAuth';
import { internalMutation } from './_generated/server';
import { assertCan, readDeal } from './lib/authz';
import { recordEvent } from './lib/audit';
import { STATUS_LABEL } from './lib/formatters';
import { generateToken, hashToken } from './lib/tokens';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

const InitialDealState = 'AWAITING_PAYMENT_CONFIRMATION';
const CLIENT_INVITE_TTL_MS = 72 * 60 * 60 * 1000;

export const list = authedQuery({
  args: {
    state: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { orgId, role, user } = ctx;
    assertCan(role, 'deal', 'R');

    const limit = Math.min(args.limit ?? 50, 200);

    let q;
    if (args.search && args.search.trim().length > 0) {
      q = ctx.db
        .query('deals')
        .withSearchIndex('search_buyer', (b) =>
          args.state
            ? b.search('buyerName', args.search!).eq('orgId', orgId).eq('state', args.state)
            : b.search('buyerName', args.search!).eq('orgId', orgId),
        );
    } else if (args.state) {
      q = ctx.db
        .query('deals')
        .withIndex('by_org_state', (b) => b.eq('orgId', orgId).eq('state', args.state!));
    } else {
      q = ctx.db
        .query('deals')
        .withIndex('by_org_created', (b) => b.eq('orgId', orgId))
        .order('desc');
    }

    const all = await q.take(limit);
    if (role !== 'agent') return all;
    return all.filter((d) => d.assignedAgentIds.includes(user._id));
  },
});

export const get = authedQuery({
  args: { id: v.id('deals') },
  handler: async (ctx, args) => {
    const deal = await readDeal(ctx, {
      dealId: args.id,
      orgId: ctx.orgId,
      userId: ctx.user._id,
      role: ctx.role,
    });

    const property = await ctx.db.get(deal.propertyId);
    const documents = await ctx.db
      .query('documents')
      .withIndex('by_deal', (q) => q.eq('dealId', deal._id))
      .collect();

    return {
      deal,
      property,
      documents,
      statusLabel: STATUS_LABEL[deal.state] ?? deal.state,
    };
  },
});

/**
 * Onboard a brand-new customer in one shot.
 *
 * Called from the agent's "Onboard customer" flow after they've re-typed
 * their password. Atomically creates property + deal + participant + invite,
 * then schedules WhatsApp/email dispatch of the magic link.
 */
export const onboardCustomer = authedAction({
  args: {
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    propertyName: v.string(),
    propertyState: v.string(),
    propertyLga: v.string(),
    propertySizeSqm: v.number(),
    propertyTitleType: v.union(
      v.literal('c_of_o'),
      v.literal('governors_consent'),
      v.literal('excision'),
      v.literal('gazette'),
      v.literal('registered_survey'),
      v.literal('family_receipt'),
    ),
    purchasePriceKobo: v.number(),
  },
  handler: async (ctx, args): Promise<{
    dealId: Id<'deals'>;
    token: string;
    expiresAt: number;
    customerName: string;
  }> => {
    if (!isValidEmail(args.customerEmail)) throw new Error('INVALID_EMAIL');
    if (!isValidNigerianPhone(args.customerPhone) && !args.customerPhone.startsWith('+1')) {
      throw new Error('INVALID_PHONE');
    }
    if (args.purchasePriceKobo <= 0) throw new Error('INVALID_PRICE');

    const token = generateToken();
    const expiresAt = Date.now() + CLIENT_INVITE_TTL_MS;

    const result = await ctx.runMutation(internal.deals._commitOnboarding, {
      orgId: ctx.orgId,
      assignedAgentId: ctx.user._id,
      actorRole: ctx.role,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      propertyName: args.propertyName,
      propertyState: args.propertyState,
      propertyLga: args.propertyLga,
      propertySizeSqm: args.propertySizeSqm,
      propertyTitleType: args.propertyTitleType,
      purchasePriceKobo: args.purchasePriceKobo,
      tokenHash: await hashToken(token),
      expiresAt,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
      orgId: ctx.orgId,
      dealId: result.dealId,
      template: 'invite.client.magic_link',
      payload: { token, expiresAt, customerName: args.customerName },
    });

    return { dealId: result.dealId, token, expiresAt, customerName: args.customerName };
  },
});

export const _commitOnboarding = internalMutation({
  args: {
    orgId: v.id('orgs'),
    assignedAgentId: v.id('users'),
    actorRole: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    propertyName: v.string(),
    propertyState: v.string(),
    propertyLga: v.string(),
    propertySizeSqm: v.number(),
    propertyTitleType: v.union(
      v.literal('c_of_o'),
      v.literal('governors_consent'),
      v.literal('excision'),
      v.literal('gazette'),
      v.literal('registered_survey'),
      v.literal('family_receipt'),
    ),
    purchasePriceKobo: v.number(),
    tokenHash: v.string(),
    pinHash: v.optional(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const propertyId = await ctx.db.insert('properties', {
      orgId: args.orgId,
      name: args.propertyName.trim(),
      state: args.propertyState.trim(),
      lga: args.propertyLga.trim(),
      sizeSqm: args.propertySizeSqm,
      titleType: args.propertyTitleType,
      photos: [],
      createdAt: now,
    });

    const dealId = await ctx.db.insert('deals', {
      orgId: args.orgId,
      propertyId,
      buyerName: args.customerName.trim(),
      buyerEmail: args.customerEmail.toLowerCase().trim(),
      buyerPhone: args.customerPhone.trim(),
      assignedAgentIds: [args.assignedAgentId],
      state: InitialDealState,
      statusLabel: STATUS_LABEL[InitialDealState]!,
      requiresWetInkDeed: true,
      purchasePriceKobo: args.purchasePriceKobo,
      paidAmountKobo: 0,
      createdBy: args.assignedAgentId,
      createdAt: now,
      updatedAt: now,
    });

    const participantId = await ctx.db.insert('participants', {
      orgId: args.orgId,
      dealId,
      kind: 'client',
      name: args.customerName.trim(),
      email: args.customerEmail.toLowerCase().trim(),
      phone: args.customerPhone.trim(),
      createdAt: now,
    });

    const inviteId = await ctx.db.insert('invitations', {
      orgId: args.orgId,
      dealId,
      participantId,
      purpose: 'client_login',
      tokenHash: args.tokenHash,
      pinHash: args.pinHash,
      scope: [`deal:read:${dealId}`],
      expiresAt: args.expiresAt,
      maxUses: 1,
      deliveredVia: ['email', 'whatsapp'],
      createdBy: args.assignedAgentId,
      createdAt: now,
    });

    await recordEvent(ctx, {
      orgId: args.orgId,
      actorUserId: args.assignedAgentId,
      actorRole: args.actorRole,
      action: 'deal.create',
      targetType: 'deal',
      targetId: dealId,
      metadata: {
        buyerEmail: args.customerEmail,
        purchasePriceKobo: args.purchasePriceKobo,
        propertyId,
        participantId,
        inviteId,
      },
    });

    return { dealId, propertyId, participantId, inviteId };
  },
});

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidNigerianPhone(s: string): boolean {
  const cleaned = s.replace(/[\s\-()]/g, '');
  return /^(\+234|234|0)[789]\d{9}$/.test(cleaned);
}
