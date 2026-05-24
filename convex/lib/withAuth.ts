import { customCtx, customMutation, customQuery, customAction } from 'convex-helpers/server/customFunctions';
import { mutation, query, action } from '../_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Doc, Id } from '../_generated/dataModel';

export type Role = 'admin' | 'manager' | 'documentation_officer' | 'agent';

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
const resolveAuth = customCtx(async (ctx: { auth: any; db: any }) => {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error('UNAUTHENTICATED');

  const user = await ctx.db.get(userId) as Doc<'users'> | null;
  if (!user) throw new Error('USER_NOT_PROVISIONED');

  // Pick the user's primary org membership. For v1, users belong to one org
  // (EcoCribs Realty). Later: read orgId from a session/header for multi-org.
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_user_org', (q: any) => q.eq('userId', userId))
    .filter((q: any) => q.eq(q.field('status'), 'active'))
    .first() as Doc<'memberships'> | null;

  if (!membership) throw new Error('NOT_A_MEMBER');

  const org = await ctx.db.get(membership.orgId) as Doc<'orgs'> | null;
  if (!org) throw new Error('ORG_NOT_FOUND');

  return {
    user,
    org,
    orgId: org._id as Id<'orgs'>,
    membership,
    role: membership.role as Role,
  };
});

export const authedQuery = customQuery(query, resolveAuth);
export const authedMutation = customMutation(mutation, resolveAuth);
export const authedAction = customAction(action, resolveAuth);
