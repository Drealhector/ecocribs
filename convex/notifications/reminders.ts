import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Schedule the 24h / 72h / 7d reminder cascade for a deal that just landed
 * in an "Awaiting Client" or "Awaiting Witness" state. The cron in
 * `crons.ts` fires due reminders.
 */
export const schedule = internalMutation({
  args: { dealId: v.id('deals'), orgId: v.id('orgs'), targetStage: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cancellable = await ctx.db
      .query('reminder_schedule')
      .withIndex('by_deal', (q) => q.eq('dealId', args.dealId))
      .filter((q) => q.eq(q.field('cancelled'), false))
      .collect();
    for (const r of cancellable) {
      await ctx.db.patch(r._id, { cancelled: true });
    }

    for (const [kind, delay] of [
      ['gentle_24h', 24 * HOUR],
      ['escalation_72h', 72 * HOUR],
      ['admin_7d', 7 * DAY],
    ] as const) {
      await ctx.db.insert('reminder_schedule', {
        orgId: args.orgId,
        dealId: args.dealId,
        nextFireAt: now + delay,
        kind,
        targetStage: args.targetStage,
        cancelled: false,
        createdAt: now,
      });
    }
  },
});

export const fireDue = internalAction({
  args: {},
  handler: async (ctx): Promise<{ fired: number }> => {
    const due = await ctx.runQuery(internal.notifications.reminders._listDue, {});
    let fired = 0;
    for (const r of due) {
      const deal = await ctx.runQuery(internal.notifications.reminders._getDeal, {
        dealId: r.dealId,
      });
      if (!deal) {
        await ctx.runMutation(internal.notifications.reminders._markFired, { id: r._id });
        continue;
      }
      // If state changed away from the stage we scheduled the reminder for,
      // cancel rather than fire — the user already acted.
      if (!deal.state.startsWith(r.targetStage)) {
        await ctx.runMutation(internal.notifications.reminders._markCancelled, { id: r._id });
        continue;
      }

      await ctx.runAction(internal.notifications.dispatch.dispatch, {
        orgId: r.orgId,
        dealId: r.dealId,
        template: `reminder.${r.kind}`,
      });
      await ctx.runMutation(internal.notifications.reminders._markFired, { id: r._id });
      fired++;
    }
    return { fired };
  },
});

export const _listDue = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query('reminder_schedule')
      .withIndex('by_due', (q) => q.eq('cancelled', false).lt('nextFireAt', now))
      .take(100);
  },
});

export const _getDeal = internalQuery({
  args: { dealId: v.id('deals') },
  handler: async (ctx, args) => ctx.db.get(args.dealId),
});

export const _markFired = internalMutation({
  args: { id: v.id('reminder_schedule') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { firedAt: Date.now(), cancelled: true });
  },
});

export const _markCancelled = internalMutation({
  args: { id: v.id('reminder_schedule') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { cancelled: true });
  },
});
