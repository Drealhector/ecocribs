import { v } from 'convex/values';
import { authedMutation, authedQuery } from './lib/withAuth';
import { internalMutation } from './_generated/server';
import { recordEvent } from './lib/audit';
import type { Doc, Id } from './_generated/dataModel';

/**
 * Commission lifecycle:
 *
 *   setForDeal (admin/manager)   — set or update % for a specific deal+agent
 *   creditOnComplete (internal)  — called when a deal hits COMPLETED, flips
 *                                  any matching commission rows from pending
 *   markCleared (staff/admin)    — record that the payment has been processed
 *   forwardToStaff (admin)       — transfer "clear this ledger" responsibility
 *                                  to a specific staff member
 *   listForAgent / listForStaff / listAll — three views, role-filtered
 */
function computeKobo(priceKobo: number, percentBps: number): number {
  return Math.round((priceKobo * percentBps) / 10_000);
}

export const setForDeal = authedMutation({
  args: {
    dealId: v.id('deals'),
    agentUserId: v.id('users'),
    percentBps: v.number(),
  },
  handler: async (ctx, args) => {
    if (ctx.role !== 'principal' && ctx.role !== 'admin' && ctx.role !== 'manager') throw new Error('FORBIDDEN');
    if (args.percentBps < 0 || args.percentBps > 5000) {
      throw new Error('INVALID_PERCENT'); // cap at 50%
    }

    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.orgId !== ctx.orgId) throw new Error('NOT_FOUND');

    const agentMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) => q.eq('userId', args.agentUserId).eq('orgId', ctx.orgId))
      .unique();
    if (!agentMembership) throw new Error('AGENT_NOT_FOUND');

    const commissionKobo = computeKobo(deal.purchasePriceKobo, args.percentBps);

    // Update existing pending row for this deal+agent, or create
    const existing = await ctx.db
      .query('commissions')
      .withIndex('by_deal', (q) => q.eq('dealId', args.dealId))
      .collect();
    const pending = existing.find((c) => c.agentUserId === args.agentUserId && c.status !== 'cleared');

    let commissionId: Id<'commissions'>;
    if (pending) {
      await ctx.db.patch(pending._id, {
        percentBps: args.percentBps,
        commissionKobo,
        status: 'pending',
        updatedAt: Date.now(),
      });
      commissionId = pending._id;
    } else {
      commissionId = await ctx.db.insert('commissions', {
        orgId: ctx.orgId,
        dealId: args.dealId,
        agentUserId: args.agentUserId,
        staffUserId: agentMembership.assignedStaffUserId,
        percentBps: args.percentBps,
        commissionKobo,
        status: 'pending',
        setBy: ctx.user._id,
        setAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await recordEvent(ctx, {
      orgId: ctx.orgId,
      actorUserId: ctx.user._id,
      actorRole: ctx.role,
      action: 'perm.grant', // reuse audit verb; means "set commission"
      targetType: 'commission',
      targetId: commissionId,
      metadata: { dealId: args.dealId, agentUserId: args.agentUserId, percentBps: args.percentBps },
    });

    return { commissionId, commissionKobo, percentBps: args.percentBps };
  },
});

export const markCleared = authedMutation({
  args: { commissionId: v.id('commissions'), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.commissionId);
    if (!row || row.orgId !== ctx.orgId) throw new Error('NOT_FOUND');
    if (ctx.role !== 'principal' && ctx.role !== 'admin' && ctx.role !== 'manager' && ctx.role !== 'documentation_officer') {
      throw new Error('FORBIDDEN');
    }
    // Staff (non-admin) can only clear their own assigned agents' rows
    if (ctx.role !== 'principal' && ctx.role !== 'admin' && row.staffUserId !== ctx.user._id) {
      throw new Error('FORBIDDEN_NOT_YOUR_AGENT');
    }
    await ctx.db.patch(args.commissionId, {
      status: 'cleared',
      clearedBy: ctx.user._id,
      clearedAt: Date.now(),
      clearedNote: args.note,
      updatedAt: Date.now(),
    });

    await recordEvent(ctx, {
      orgId: ctx.orgId,
      actorUserId: ctx.user._id,
      actorRole: ctx.role,
      action: 'perm.revoke', // means "commission cleared/paid out"
      targetType: 'commission',
      targetId: args.commissionId,
      metadata: { commissionKobo: row.commissionKobo, agentUserId: row.agentUserId },
    });

    return { ok: true };
  },
});

export const forwardToStaff = authedMutation({
  args: { commissionId: v.id('commissions'), staffUserId: v.id('users') },
  handler: async (ctx, args) => {
    if (ctx.role !== 'principal' && ctx.role !== 'admin') throw new Error('FORBIDDEN');
    const row = await ctx.db.get(args.commissionId);
    if (!row || row.orgId !== ctx.orgId) throw new Error('NOT_FOUND');
    await ctx.db.patch(args.commissionId, {
      staffUserId: args.staffUserId,
      forwardedToStaffAt: Date.now(),
      forwardedToStaffBy: ctx.user._id,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

/**
 * Internal — called from convex/deals.ts when a deal hits COMPLETED. Bumps
 * any pending commission rows from set→credited (still 'pending' status,
 * but the deal is now closed so it's ready for Staff to clear).
 */
export const creditOnComplete = internalMutation({
  args: { dealId: v.id('deals') },
  handler: async (ctx, args) => {
    // Recompute kobo in case price changed since commission was set
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return;
    const rows = await ctx.db
      .query('commissions')
      .withIndex('by_deal', (q) => q.eq('dealId', args.dealId))
      .collect();
    for (const r of rows) {
      if (r.status !== 'pending') continue;
      const k = computeKobo(deal.purchasePriceKobo, r.percentBps);
      if (k !== r.commissionKobo) {
        await ctx.db.patch(r._id, { commissionKobo: k, updatedAt: Date.now() });
      }
    }
  },
});

/**
 * Three filtered views over the same ledger.
 */
export const listForAgent = authedQuery({
  args: {},
  handler: async (ctx) => {
    if (ctx.role !== 'agent') return [];
    return await ctx.db
      .query('commissions')
      .withIndex('by_agent', (q) => q.eq('agentUserId', ctx.user._id))
      .order('desc')
      .collect();
  },
});

export const listForStaff = authedQuery({
  args: { status: v.optional(v.union(v.literal('pending'), v.literal('cleared'), v.literal('cancelled'))) },
  handler: async (ctx, args) => {
    if (ctx.role !== 'manager' && ctx.role !== 'documentation_officer') return [];
    let q = ctx.db
      .query('commissions')
      .withIndex('by_staff_status', (b) => b.eq('staffUserId', ctx.user._id));
    if (args.status) q = q.filter((f) => f.eq(f.field('status'), args.status));
    return await q.order('desc').collect();
  },
});

export const listAll = authedQuery({
  args: { status: v.optional(v.union(v.literal('pending'), v.literal('cleared'), v.literal('cancelled'))) },
  handler: async (ctx, args) => {
    if (ctx.role !== 'principal' && ctx.role !== 'admin') return [];
    let q = ctx.db.query('commissions').withIndex('by_org_status', (b) => b.eq('orgId', ctx.orgId));
    if (args.status) q = q.filter((f) => f.eq(f.field('status'), args.status));
    const rows = await q.order('desc').collect();
    // Hydrate the agent + staff names + deal info for the ledger UI
    const out: any[] = [];
    for (const r of rows) {
      const agent = await ctx.db.get(r.agentUserId);
      const staff = r.staffUserId ? await ctx.db.get(r.staffUserId) : null;
      const deal = await ctx.db.get(r.dealId);
      const property = deal ? await ctx.db.get(deal.propertyId) : null;
      out.push({
        ...r,
        agentName: (agent?.fullName ?? agent?.name ?? agent?.email) || '—',
        staffName: staff ? (staff.fullName ?? staff.name ?? staff.email) : null,
        dealBuyer: deal?.buyerName ?? '—',
        dealValueKobo: deal?.purchasePriceKobo ?? 0,
        dealState: deal?.state ?? '—',
        propertyName: property?.name ?? '—',
      });
    }
    return out;
  },
});
