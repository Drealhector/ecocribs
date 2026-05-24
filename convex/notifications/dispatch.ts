import { v } from 'convex/values';
import { internalAction, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';

/**
 * Single fan-out point for every deal-related event. Reads channel
 * preferences from the deal/participants and routes to:
 *
 *   - WhatsApp via Twilio (pre-approved Meta template)
 *   - Email via Resend
 *   - In-app realtime (insert into notifications table; client reads via
 *     useQuery and rerenders)
 *
 * Reminder cron uses the same dispatcher.
 */
export const dispatch = internalAction({
  args: {
    orgId: v.id('orgs'),
    dealId: v.id('deals'),
    template: v.string(),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.runQuery(internal.notifications.dispatch._getDealForNotify, {
      dealId: args.dealId,
    });
    if (!deal) return;

    const recipients = await resolveRecipients(deal, args.template);

    for (const r of recipients) {
      if (r.channel === 'in_app' || r.channel === 'all') {
        await ctx.runMutation(internal.notifications.dispatch._queue, {
          orgId: args.orgId,
          dealId: args.dealId,
          recipientUserId: r.userId,
          recipientParticipantId: r.participantId,
          channel: 'in_app',
          template: args.template,
          payload: args.payload ?? {},
        });
      }

      if ((r.channel === 'email' || r.channel === 'all') && r.email) {
        await ctx.runMutation(internal.notifications.dispatch._queue, {
          orgId: args.orgId,
          dealId: args.dealId,
          recipientUserId: r.userId,
          recipientParticipantId: r.participantId,
          recipientEmail: r.email,
          channel: 'email',
          template: args.template,
          payload: args.payload ?? {},
        });
        // TODO(production): Resend send + record providerMessageId
      }

      if ((r.channel === 'whatsapp' || r.channel === 'all') && r.phone) {
        await ctx.runMutation(internal.notifications.dispatch._queue, {
          orgId: args.orgId,
          dealId: args.dealId,
          recipientUserId: r.userId,
          recipientParticipantId: r.participantId,
          recipientPhone: r.phone,
          channel: 'whatsapp',
          template: args.template,
          payload: args.payload ?? {},
        });
        // TODO(production): Twilio WhatsApp send + record providerMessageId.
        // On failure, fall back to email (one retry). SMS is out-of-scope for v1.
      }
    }
  },
});

type Recipient = {
  userId?: Id<'users'>;
  participantId?: Id<'participants'>;
  email?: string;
  phone?: string;
  channel: 'in_app' | 'email' | 'whatsapp' | 'all';
};

async function resolveRecipients(
  deal: { _id: Id<'deals'>; buyerEmail: string; buyerPhone: string; assignedAgentIds: Id<'users'>[] },
  template: string,
): Promise<Recipient[]> {
  // Receipt, offer, contract, deed → buyer. Reminders → buyer + assigned agents.
  // Witness invites → witness only. Admin alert → managers.
  const all: Recipient[] = [];
  if (template.startsWith('reminder.') || template === 'receipt.sent' || template.startsWith('offer.') ||
      template.startsWith('contract.') || template.startsWith('deed.') || template === 'invite.client.magic_link') {
    all.push({ email: deal.buyerEmail, phone: deal.buyerPhone, channel: 'all' });
  }
  return all;
}

export const _getDealForNotify = internalMutation({
  args: { dealId: v.id('deals') },
  handler: async (ctx, args) => ctx.db.get(args.dealId),
});

export const _queue = internalMutation({
  args: {
    orgId: v.id('orgs'),
    dealId: v.optional(v.id('deals')),
    recipientUserId: v.optional(v.id('users')),
    recipientParticipantId: v.optional(v.id('participants')),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    channel: v.union(v.literal('email'), v.literal('whatsapp'), v.literal('in_app')),
    template: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('notifications', {
      ...args,
      state: 'queued',
      queuedAt: Date.now(),
    });
  },
});
