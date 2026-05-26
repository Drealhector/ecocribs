import { authedQuery } from './lib/withAuth';
import { assertCan } from './lib/authz';

/**
 * The currently signed-in user's profile + role + org. Returned to the web
 * client so the UI can adapt (Boss sees everything; Agent sees their own).
 */
export const me = authedQuery({
  args: {},
  handler: async (ctx) => ({
    userId: ctx.user._id,
    email: ctx.user.email,
    fullName: ctx.user.fullName ?? ctx.user.name ?? ctx.user.email,
    role: ctx.role,
    orgId: ctx.orgId,
    orgName: ctx.org.name,
  }),
});

/**
 * All staff in the caller's org. Used by the Boss/Manager when creating a
 * deal so they can assign an agent. Agents only see themselves.
 */
export const listStaff = authedQuery({
  args: {},
  handler: async (ctx) => {
    assertCan(ctx.role, 'member', 'R');
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_org', (q) => q.eq('orgId', ctx.orgId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const users = await Promise.all(memberships.map((m) => ctx.db.get(m.userId)));
    return memberships
      .map((m, i) => {
        const u = users[i];
        if (!u) return null;
        return {
          userId: u._id,
          email: u.email,
          fullName: u.fullName ?? u.name ?? u.email,
          role: m.role,
        };
      })
      .filter(Boolean);
  },
});

