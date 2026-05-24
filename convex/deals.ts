import { v } from 'convex/values';
import { authedQuery, authedMutation } from './lib/withAuth';
import { assertCan, assertValidTransition, readDeal } from './lib/authz';
import { recordEvent } from './lib/audit';
import { STATUS_LABEL } from './lib/formatters';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

const InitialDealState = 'AWAITING_PAYMENT_CONFIRMATION';

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

export const create = authedMutation({
  args: {
    propertyId: v.id('properties'),
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.string(),
    purchasePriceKobo: v.number(),
    assignedAgentIds: v.array(v.id('users')),
    documentationOfficerId: v.optional(v.id('users')),
    requiresWetInkDeed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { orgId, role, user } = ctx;
    assertCan(role, 'deal', 'W');

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.orgId !== orgId) throw new Error('NOT_FOUND');
    if (args.purchasePriceKobo <= 0) throw new Error('INVALID_PRICE');
    if (!isValidEmail(args.buyerEmail)) throw new Error('INVALID_EMAIL');
    if (!isValidNigerianPhone(args.buyerPhone)) throw new Error('INVALID_PHONE');

    const now = Date.now();
    const dealId = await ctx.db.insert('deals', {
      orgId,
      propertyId: args.propertyId,
      buyerName: args.buyerName.trim(),
      buyerEmail: args.buyerEmail.toLowerCase().trim(),
      buyerPhone: args.buyerPhone.trim(),
      assignedAgentIds: args.assignedAgentIds,
      documentationOfficerId: args.documentationOfficerId,
      state: InitialDealState,
      statusLabel: STATUS_LABEL[InitialDealState]!,
      requiresWetInkDeed: args.requiresWetInkDeed ?? true,
      purchasePriceKobo: args.purchasePriceKobo,
      paidAmountKobo: 0,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    await recordEvent(ctx, {
      orgId,
      actorUserId: user._id,
      actorRole: role,
      action: 'deal.create',
      targetType: 'deal',
      targetId: dealId,
      metadata: { buyerEmail: args.buyerEmail, purchasePriceKobo: args.purchasePriceKobo },
    });

    return dealId;
  },
});

export const confirmPayment = authedMutation({
  args: {
    dealId: v.id('deals'),
    paidAmountKobo: v.number(),
    paymentMethod: v.string(),
    paymentReference: v.string(),
  },
  handler: async (ctx, args) => {
    const { orgId, role, user } = ctx;
    if (role !== 'admin' && role !== 'manager' && role !== 'documentation_officer') {
      throw new Error('FORBIDDEN');
    }

    const deal = await readDeal(ctx, {
      dealId: args.dealId,
      orgId,
      userId: user._id,
      role,
    });

    if (deal.state !== 'AWAITING_PAYMENT_CONFIRMATION') {
      throw new Error('INVALID_STATE_FOR_PAYMENT');
    }

    assertValidTransition(deal.state, 'RECEIPT_SENT');

    const now = Date.now();
    await ctx.db.patch(args.dealId, {
      state: 'RECEIPT_SENT',
      statusLabel: STATUS_LABEL['RECEIPT_SENT']!,
      paidAmountKobo: args.paidAmountKobo,
      paymentMethod: args.paymentMethod,
      paymentReference: args.paymentReference,
      paymentConfirmedAt: now,
      paymentConfirmedBy: user._id,
      updatedAt: now,
    });

    await recordEvent(ctx, {
      orgId,
      actorUserId: user._id,
      actorRole: role,
      action: 'deal.transition',
      targetType: 'deal',
      targetId: args.dealId,
      metadata: {
        from: 'AWAITING_PAYMENT_CONFIRMATION',
        to: 'RECEIPT_SENT',
        paymentReference: args.paymentReference,
      },
    });

    await ctx.scheduler.runAfter(0, internal.documents.generate.generateReceipt, {
      dealId: args.dealId,
    });

    return { state: 'RECEIPT_SENT' };
  },
});

export const transition = authedMutation({
  args: {
    dealId: v.id('deals'),
    nextState: v.string(),
    overrideReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { orgId, role, user } = ctx;
    assertCan(role, 'deal', 'W');

    const deal = await readDeal(ctx, {
      dealId: args.dealId,
      orgId,
      userId: user._id,
      role,
    });

    const isOverride = !!args.overrideReason;
    if (!isOverride) {
      assertValidTransition(deal.state, args.nextState);
    } else if (role !== 'admin' && role !== 'manager') {
      throw new Error('OVERRIDE_FORBIDDEN');
    }

    const now = Date.now();
    await ctx.db.patch(args.dealId, {
      state: args.nextState,
      statusLabel: STATUS_LABEL[args.nextState] ?? args.nextState,
      updatedAt: now,
      ...(args.nextState === 'COMPLETED' ? { completedAt: now } : {}),
      ...(args.nextState === 'ARCHIVED' ? { archivedAt: now } : {}),
    });

    await recordEvent(ctx, {
      orgId,
      actorUserId: user._id,
      actorRole: role,
      action: isOverride ? 'deal.override' : 'deal.transition',
      targetType: 'deal',
      targetId: args.dealId,
      metadata: {
        from: deal.state,
        to: args.nextState,
        ...(args.overrideReason ? { reason: args.overrideReason } : {}),
      },
    });

    return { state: args.nextState };
  },
});

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidNigerianPhone(s: string): boolean {
  const cleaned = s.replace(/[\s\-()]/g, '');
  return /^(\+234|234|0)[789]\d{9}$/.test(cleaned);
}
