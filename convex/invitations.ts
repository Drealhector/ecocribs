import { v } from 'convex/values';
import { authedMutation, authedAction } from './lib/withAuth';
import { internalMutation, mutation } from './_generated/server';
import { internal } from './_generated/api';
import { assertCan, readDeal } from './lib/authz';
import { recordEvent } from './lib/audit';
import { generateToken, generatePin, hashToken, hashPin, constantTimeEqual } from './lib/tokens';

const CLIENT_TTL_MS = 72 * 60 * 60 * 1000;
const WITNESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Admin invites a client to a deal. Issues a single-use magic link + 6-digit
 * PIN delivered over a separate channel (link via email, PIN via WhatsApp).
 *
 * Returns the raw token+PIN to the caller exactly once so they can be sent.
 * After this call, only sha256 digests remain in storage.
 */
export const createClientInvite = authedAction({
  args: {
    dealId: v.id('deals'),
  },
  handler: async (ctx, args): Promise<{ token: string; pin: string; expiresAt: number }> => {
    const token = generateToken();
    const pin = generatePin();

    const result = await ctx.runMutation(internal.invitations._persistInvite, {
      dealId: args.dealId,
      orgId: ctx.orgId,
      purpose: 'client_login',
      tokenHash: await hashToken(token),
      pinHash: await hashPin(pin, token),
      scope: [`deal:read:${args.dealId}`],
      expiresAt: Date.now() + CLIENT_TTL_MS,
      maxUses: 1,
      deliveredVia: ['email', 'whatsapp'],
      createdBy: ctx.user._id,
      actorRole: ctx.role,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
      orgId: ctx.orgId,
      dealId: args.dealId,
      template: 'invite.client.magic_link',
      payload: { token, pin, expiresAt: result.expiresAt },
    });

    return { token, pin, expiresAt: result.expiresAt };
  },
});

export const createWitnessInvite = authedAction({
  args: {
    dealId: v.id('deals'),
    documentId: v.id('documents'),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args): Promise<{ token: string; pin: string; expiresAt: number }> => {
    const token = generateToken();
    const pin = generatePin();

    const participantId = await ctx.runMutation(internal.invitations._createParticipant, {
      orgId: ctx.orgId,
      dealId: args.dealId,
      kind: 'witness',
      name: args.name,
      email: args.email,
      phone: args.phone,
    });

    const result = await ctx.runMutation(internal.invitations._persistInvite, {
      dealId: args.dealId,
      orgId: ctx.orgId,
      participantId,
      purpose: 'witness_sign',
      tokenHash: await hashToken(token),
      pinHash: await hashPin(pin, token),
      scope: [`doc:sign:${args.documentId}`],
      expiresAt: Date.now() + WITNESS_TTL_MS,
      maxUses: 1,
      deliveredVia: ['email', 'whatsapp'],
      createdBy: ctx.user._id,
      actorRole: ctx.role,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
      orgId: ctx.orgId,
      dealId: args.dealId,
      template: 'invite.witness.magic_link',
      payload: {
        token,
        pin,
        expiresAt: result.expiresAt,
        witnessName: args.name,
        documentId: args.documentId,
      },
    });

    return { token, pin, expiresAt: result.expiresAt };
  },
});

export const _createParticipant = internalMutation({
  args: {
    orgId: v.id('orgs'),
    dealId: v.id('deals'),
    kind: v.union(v.literal('client'), v.literal('witness'), v.literal('guest')),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('participants', {
      orgId: args.orgId,
      dealId: args.dealId,
      kind: args.kind,
      name: args.name.trim(),
      email: args.email.toLowerCase().trim(),
      phone: args.phone.trim(),
      createdAt: Date.now(),
    });
  },
});

export const _persistInvite = internalMutation({
  args: {
    dealId: v.id('deals'),
    orgId: v.id('orgs'),
    participantId: v.optional(v.id('participants')),
    purpose: v.union(
      v.literal('client_login'),
      v.literal('witness_sign'),
      v.literal('guest_view'),
    ),
    tokenHash: v.string(),
    pinHash: v.string(),
    scope: v.array(v.string()),
    expiresAt: v.number(),
    maxUses: v.number(),
    deliveredVia: v.array(v.union(v.literal('email'), v.literal('whatsapp'), v.literal('sms'))),
    createdBy: v.id('users'),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert('invitations', {
      orgId: args.orgId,
      dealId: args.dealId,
      participantId: args.participantId,
      purpose: args.purpose,
      tokenHash: args.tokenHash,
      pinHash: args.pinHash,
      scope: args.scope,
      expiresAt: args.expiresAt,
      maxUses: args.maxUses,
      deliveredVia: args.deliveredVia,
      createdBy: args.createdBy,
      createdAt: now,
    });

    await recordEvent(ctx, {
      orgId: args.orgId,
      actorUserId: args.createdBy,
      actorRole: args.actorRole,
      action: 'invite.create',
      targetType: 'invitation',
      targetId: id,
      metadata: { purpose: args.purpose, expiresAt: args.expiresAt },
    });

    return { id, expiresAt: args.expiresAt };
  },
});

/**
 * Unauthenticated accept-invite endpoint. Verifies token + PIN in constant
 * time, atomically marks usedAt, returns a participant session token bound
 * to the deal scope.
 */
export const acceptInvite = mutation({
  args: { token: v.string(), pin: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.token);
    const invite = await ctx.db
      .query('invitations')
      .withIndex('by_token', (q) => q.eq('tokenHash', tokenHash))
      .unique();

    if (!invite) throw new Error('INVALID_OR_EXPIRED');
    if (invite.usedAt) throw new Error('INVALID_OR_EXPIRED');
    if (invite.revokedAt) throw new Error('INVALID_OR_EXPIRED');
    if (Date.now() > invite.expiresAt) throw new Error('INVALID_OR_EXPIRED');

    const expectedPinHash = await hashPin(args.pin, args.token);
    if (!constantTimeEqual(expectedPinHash, invite.pinHash ?? '')) {
      throw new Error('INVALID_OR_EXPIRED'); // don't reveal whether token or PIN was wrong
    }

    const now = Date.now();
    await ctx.db.patch(invite._id, { usedAt: now });

    await recordEvent(ctx, {
      orgId: invite.orgId,
      actorParticipantId: invite.participantId,
      actorRole: invite.purpose === 'witness_sign' ? 'witness' : 'client',
      action: 'invite.accept',
      targetType: 'invitation',
      targetId: invite._id,
    });

    return {
      dealId: invite.dealId,
      participantId: invite.participantId ?? null,
      purpose: invite.purpose,
      scope: invite.scope,
      sessionExpiresAt: now + 8 * 60 * 60 * 1000, // 8h absolute
    };
  },
});
