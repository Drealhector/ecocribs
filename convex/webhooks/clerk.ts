import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

/**
 * Clerk webhook handlers. Idempotent — Clerk retries.
 *
 * Map: clerkId → our `users._id`; clerkOrgId → our `orgs._id`. We never use
 * Clerk IDs as foreign keys directly — we maintain our own primary IDs so
 * the schema survives an auth-provider migration.
 */
export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        phone: args.phone,
        fullName: args.fullName,
        avatarUrl: args.avatarUrl,
      });
      return existing._id;
    }
    return await ctx.db.insert('users', {
      clerkId: args.clerkId,
      email: args.email,
      phone: args.phone,
      fullName: args.fullName,
      avatarUrl: args.avatarUrl,
      mfaEnabled: false,
      createdAt: now,
    });
  },
});

export const upsertOrg = internalMutation({
  args: { clerkOrgId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('orgs')
      .withIndex('by_clerk_org', (q) => q.eq('clerkOrgId', args.clerkOrgId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { name: args.name });
      return existing._id;
    }
    return await ctx.db.insert('orgs', {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      governingLawDefault: 'lagos',
      createdAt: Date.now(),
    });
  },
});

export const upsertMembership = internalMutation({
  args: {
    clerkUserId: v.string(),
    clerkOrgId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk', (q) => q.eq('clerkId', args.clerkUserId))
      .unique();
    const org = await ctx.db
      .query('orgs')
      .withIndex('by_clerk_org', (q) => q.eq('clerkOrgId', args.clerkOrgId))
      .unique();
    if (!user || !org) return null;

    const role = mapClerkRole(args.role);
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) => q.eq('userId', user._id).eq('orgId', org._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role, status: 'active' });
      return existing._id;
    }

    return await ctx.db.insert('memberships', {
      userId: user._id,
      orgId: org._id,
      role,
      status: 'active',
      teamIds: [],
      createdAt: Date.now(),
    });
  },
});

function mapClerkRole(clerkRole: string): 'admin' | 'manager' | 'documentation_officer' | 'agent' {
  switch (clerkRole) {
    case 'org:admin':
      return 'admin';
    case 'org:manager':
      return 'manager';
    case 'org:documentation_officer':
      return 'documentation_officer';
    default:
      return 'agent';
  }
}
