import { customCtx, customMutation, customQuery, customAction } from 'convex-helpers/server/customFunctions';
import { mutation, query, action } from '../_generated/server';
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
 * this wrapper — NEVER trusted from the JWT claim alone, because Clerk's role
 * claim can lag if changed via API mid-session.
 */
const resolveAuth = customCtx(async (ctx: { auth: any; db: any }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('UNAUTHENTICATED');

  const user = (await ctx.db
    .query('users')
    .withIndex('by_clerk', (q: any) => q.eq('clerkId', identity.subject))
    .unique()) as Doc<'users'> | null;

  if (!user) throw new Error('USER_NOT_PROVISIONED');

  const orgClerkId = (identity as any).orgId as string | undefined;
  if (!orgClerkId) throw new Error('NO_ORG_CONTEXT');

  const org = (await ctx.db
    .query('orgs')
    .withIndex('by_clerk_org', (q: any) => q.eq('clerkOrgId', orgClerkId))
    .unique()) as Doc<'orgs'> | null;
  if (!org) throw new Error('ORG_NOT_PROVISIONED');

  const membership = (await ctx.db
    .query('memberships')
    .withIndex('by_user_org', (q: any) => q.eq('userId', user._id).eq('orgId', org._id))
    .unique()) as Doc<'memberships'> | null;

  if (!membership || membership.status !== 'active') throw new Error('NOT_A_MEMBER');

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
