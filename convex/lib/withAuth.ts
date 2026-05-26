import { customCtx, customMutation, customQuery, customAction } from 'convex-helpers/server/customFunctions';
import { v } from 'convex/values';
import { mutation, query, action, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Doc, Id } from '../_generated/dataModel';

export type Role = 'principal' | 'admin' | 'manager' | 'documentation_officer' | 'agent';

/**
 * Single chokepoint for tenant + identity + role resolution.
 *
 * Every query/mutation/action that touches business data MUST go through one
 * of `authedQuery` / `authedMutation` / `authedAction`. Direct `ctx.db` access
 * is permitted only inside this module and `internal*` functions.
 *
 * The role used to authorize a request is always re-read from the DB inside
 * this wrapper — NEVER trusted from any token claim — because role changes
 * via API can lag if cached in a session token.
 *
 * Auth source: Convex Auth. `getAuthUserId(ctx)` returns the `Id<'users'>`
 * directly because the Convex Auth `users` table IS our `users` table.
 */
async function loadUserContext(ctx: any, userId: Id<'users'>) {
  const user = (await ctx.db.get(userId)) as Doc<'users'> | null;
  if (!user) throw new Error('USER_NOT_PROVISIONED');

  // Pick the user's primary org membership. For v1, users belong to one org
  // (EcoCribs Realty). Later: read orgId from a session/header for multi-org.
  let membership = (await ctx.db
    .query('memberships')
    .withIndex('by_user_org', (q: any) => q.eq('userId', userId))
    .filter((q: any) => q.eq(q.field('status'), 'active'))
    .first()) as Doc<'memberships'> | null;

  // First-user bootstrap: if there's no membership AND no org exists yet, the
  // signing-in user becomes the Principal (owner) of a new EcoCribs Realty
  // org. Principal sits above admin and is the only role that can invite or
  // remove admins. Only fires from mutations (queries are read-only) — actions
  // go through the runQuery path which uses the internal `_resolveUserContext`
  // query that returns null instead of bootstrapping.
  if (!membership && typeof ctx.db.insert === 'function') {
    const anyOrg = await ctx.db.query('orgs').first();
    if (!anyOrg) {
      const orgId = await ctx.db.insert('orgs', {
        clerkOrgId: '',
        name: 'EcoCribs Realty',
        governingLawDefault: 'lagos' as const,
        createdAt: Date.now(),
      });
      const memId = await ctx.db.insert('memberships', {
        userId,
        orgId,
        role: 'principal' as Role,
        status: 'active' as const,
        teamIds: [],
        createdAt: Date.now(),
      });
      membership = (await ctx.db.get(memId)) as Doc<'memberships'>;
    }
  }

  if (!membership) throw new Error('NOT_A_MEMBER');

  const org = (await ctx.db.get(membership.orgId)) as Doc<'orgs'> | null;
  if (!org) throw new Error('ORG_NOT_FOUND');

  return {
    user,
    org,
    orgId: org._id as Id<'orgs'>,
    membership,
    role: membership.role as Role,
  };
}

const resolveAuthQM = customCtx(async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('UNAUTHENTICATED');
  return await loadUserContext(ctx, userId);
});

const resolveAuthAction = customCtx(async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('UNAUTHENTICATED');
  const data = await ctx.runQuery(internal.lib.withAuth._resolveUserContext, { userId });
  if (!data) throw new Error('NOT_A_MEMBER');
  return data as Awaited<ReturnType<typeof loadUserContext>>;
});

/**
 * Internal query used by `authedAction` to resolve the caller's user + org
 * + membership via runQuery (since actions don't expose `ctx.db` directly).
 */
export const _resolveUserContext = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    try {
      return await loadUserContext(ctx, args.userId);
    } catch {
      return null;
    }
  },
});

export const authedQuery = customQuery(query, resolveAuthQM);
export const authedMutation = customMutation(mutation, resolveAuthQM);
export const authedAction = customAction(action, resolveAuthAction);
