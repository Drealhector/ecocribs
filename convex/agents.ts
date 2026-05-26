import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { authedQuery } from './lib/withAuth';
import { recordEvent } from './lib/audit';
import type { Id } from './_generated/dataModel';

/**
 * Public agent signup — anyone can register, no invite required. The
 * caller's Convex Auth user must already exist. Auto-assigns the
 * least-loaded staff (manager / doc officer / admin / principal) as
 * this agent's supervisor.
 */
export const completePublicSignup = mutation({
  args: { userId: v.id('users'), fullName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const org = await ctx.db.query('orgs').first();
    if (!org) throw new Error('NO_ORG_YET');

    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) => q.eq('userId', args.userId).eq('orgId', org._id))
      .unique();
    if (existing) return { orgId: org._id, role: existing.role };

    const staffMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_org_role', (q) => q.eq('orgId', org._id).eq('role', 'manager'))
      .collect();
    const docOfficerMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_org_role', (q) => q.eq('orgId', org._id).eq('role', 'documentation_officer'))
      .collect();
    const adminMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_org_role', (q) => q.eq('orgId', org._id).eq('role', 'admin'))
      .collect();
    const principalMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_org_role', (q) => q.eq('orgId', org._id).eq('role', 'principal'))
      .collect();

    const candidates = [
      ...staffMemberships,
      ...docOfficerMemberships,
      ...adminMemberships,
      ...principalMemberships,
    ].filter((m) => m.status === 'active');

    let assignedStaffUserId: Id<'users'> | undefined;
    if (candidates.length > 0) {
      const allAgents = await ctx.db
        .query('memberships')
        .withIndex('by_org_role', (q) => q.eq('orgId', org._id).eq('role', 'agent'))
        .collect();
      const load: Record<string, number> = {};
      for (const m of candidates) load[m.userId] = 0;
      for (const a of allAgents) {
        if (a.assignedStaffUserId && a.assignedStaffUserId in load) {
          load[a.assignedStaffUserId] = (load[a.assignedStaffUserId] ?? 0) + 1;
        }
      }
      let minLoad = Infinity;
      for (const m of candidates) {
        const l = load[m.userId] ?? 0;
        if (l < minLoad) {
          minLoad = l;
          assignedStaffUserId = m.userId;
        }
      }
    }

    if (args.fullName && !user.fullName) {
      await ctx.db.patch(args.userId, { fullName: args.fullName });
    }

    const membershipId = await ctx.db.insert('memberships', {
      userId: args.userId,
      orgId: org._id,
      role: 'agent',
      status: 'active',
      teamIds: [],
      assignedStaffUserId,
      createdAt: Date.now(),
    });

    await recordEvent(ctx, {
      orgId: org._id,
      actorUserId: args.userId,
      actorRole: 'agent',
      action: 'invite.accept',
      targetType: 'membership',
      targetId: membershipId,
      metadata: { mode: 'public_agent_signup', assignedStaffUserId },
    });

    return { orgId: org._id, role: 'agent' as const };
  },
});

/**
 * Agent dashboard — lists customers (deals) the agent brought in.
 */
export const listMyCustomers = authedQuery({
  args: {},
  handler: async (ctx) => {
    const deals = await ctx.db
      .query('deals')
      .withIndex('by_org_created', (q) => q.eq('orgId', ctx.orgId))
      .order('desc')
      .collect();
    return deals.filter((d) => d.assignedAgentIds.includes(ctx.user._id));
  },
});
