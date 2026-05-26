import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { recordEvent } from './lib/audit';
import { hashToken } from './lib/tokens';

/**
 * Unauthenticated accept-invite endpoint. The token alone is enough — one
 * tap from WhatsApp/email gets the customer into their portal.
 *
 * The token is 32 random bytes, single-use, 72h TTL. No PIN required.
 */
export const acceptInvite = mutation({
  args: { token: v.string() },
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
      sessionExpiresAt: now + 8 * 60 * 60 * 1000,
    };
  },
});
