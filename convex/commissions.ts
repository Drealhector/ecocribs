import { v } from 'convex/values';
import { authedMutation, authedQuery } from './lib/withAuth';
import { recordEvent } from './lib/audit';
import type { Id } from './_generated/dataModel';

/**
 * Commission lifecycle:
 *   setForDeal (principal/admin/manager) — set or update % for a deal+agent
 *   markCleared (staff/admin)            — record that payout has been processed
 *   listForAgent / listAll               — two views, role-filtered
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
    if (args.percentBps < 0 || args.percentBps > 5000) throw new Error('INVALID_PERCENT'); // cap at 50%

    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.orgId !== ctx.orgId) throw new Error('NOT_FOUND');

    const agentMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) => q.eq('userId', args.agentUserId).eq('orgId', ctx.orgId))
      .unique();
    if (!agentMembership) throw new Error('AGENT_NOT_FOUND');

    const commissionKobo = computeKobo(deal.purchasePriceKobo, args.percentBps);

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
      action: 'perm.grant',
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
      action: 'perm.revoke',
      targetType: 'commission',
      targetId: args.commissionId,
      metadata: { commissionKobo: row.commissionKobo, agentUserId: row.agentUserId },
    });

    return { ok: true };
  },
});

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

export const listAll = authedQuery({
  args: { status: v.optional(v.union(v.literal('pending'), v.literal('cleared'), v.literal('cancelled'))) },
  handler: async (ctx, args) => {
    if (ctx.role !== 'principal' && ctx.role !== 'admin') return [];
    let q = ctx.db.query('commissions').withIndex('by_org_status', (b) => b.eq('orgId', ctx.orgId));
    if (args.status) q = q.filter((f) => f.eq(f.field('status'), args.status));
    const rows = await q.order('desc').collect();
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
