import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { authedQuery } from './lib/withAuth';
import { internal } from './_generated/api';
import { recordEvent } from './lib/audit';
import type { Id } from './_generated/dataModel';

/**
 * Public agent signup — anyone can register, no invite required. The
 * caller's Convex Auth user must already exist (created by their
 * preceding password signUp call). This action:
 *
 *   1. Confirms the user has no membership yet in any org
 *   2. Picks the EcoCribs Realty org (currently the only org)
 *   3. Auto-assigns the least-loaded staff (manager / doc officer) as
 *      this agent's supervisor
 *   4. Creates an active membership with role='agent'
 *
 * Returns the orgId so the client can redirect into /agent.
 */
export const completePublicSignup = mutation({
  args: { userId: v.id('users'), fullName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    const org = await ctx.db.query('orgs').first();
    if (!org) throw new Error('NO_ORG_YET'); // boss must register first

    // Don't double-add
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) => q.eq('userId', args.userId).eq('orgId', org._id))
      .unique();
    if (existing) return { orgId: org._id, role: existing.role };

    // Pick least-loaded staff (manager OR documentation_officer)
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

    const candidates = [...staffMemberships, ...docOfficerMemberships, ...adminMemberships]
      .filter((m) => m.status === 'active');

    let assignedStaffUserId: Id<'users'> | undefined;
    if (candidates.length > 0) {
      // Count active agents per staff
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
      action: 'invite.accept', // re-uses existing audit action; means "joined"
      targetType: 'membership',
      targetId: membershipId,
      metadata: { mode: 'public_agent_signup', assignedStaffUserId },
    });

    return { orgId: org._id, role: 'agent' as const };
  },
});

/**
 * Agent dashboard — lists customers (deals) the agent brought in.
 * Filtered to deals where the agent is in assignedAgentIds.
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

/**
 * Staff dashboard — list the agents this staff supervises plus a brief
 * summary of each agent's pipeline (count of active deals).
 */
export const listMyAgents = authedQuery({
  args: {},
  handler: async (ctx) => {
    if (ctx.role !== 'manager' && ctx.role !== 'documentation_officer' && ctx.role !== 'admin') {
      return [];
    }
    let agentMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_org_role', (q) => q.eq('orgId', ctx.orgId).eq('role', 'agent'))
      .collect();
    // Admin sees ALL agents; staff sees only their assigned roster
    if (ctx.role !== 'admin') {
      agentMemberships = agentMemberships.filter((m) => m.assignedStaffUserId === ctx.user._id);
    }
    const result = [];
    for (const m of agentMemberships) {
      const u = await ctx.db.get(m.userId);
      if (!u) continue;
      result.push({
        userId: u._id,
        email: u.email,
        fullName: u.fullName ?? u.name ?? u.email,
        joinedAt: m.createdAt,
      });
    }
    return result;
  },
});
