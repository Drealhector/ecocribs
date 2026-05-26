/**
 * Seed the first EcoCribs Realty org + Principal membership.
 *
 * Convex Auth creates the actual `users` row when the founder signs up via the
 * Password provider. This mutation is run *after* that signup to attach a
 * profile + a `principal` membership to a freshly-created org. It is a no-op
 * if any org already exists, so it is safe to run repeatedly.
 *
 * The first human is always the Principal — the top of the hierarchy
 * (Principal → Admin → Staff → Agent → Customer). Only the Principal can
 * invite or remove admins; everything else admin can do, Principal can do too.
 *
 * Usage from the Convex dashboard (or a one-shot CLI):
 *   npx convex run seed:seedFirstAdmin '{
 *     "userId": "<users _id from Convex Auth>",
 *     "email":  "principal@ecocribs.com",
 *     "fullName": "Hector Sam"
 *   }'
 */
import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

export const seedFirstAdmin = internalMutation({
  args: {
    userId: v.id('users'),
    email: v.string(),
    fullName: v.string(),
  },
  handler: async (ctx, args) => {
    // Refuse to seed if any org already exists — we only seed the first one.
    const existingOrg = await ctx.db.query('orgs').first();
    if (existingOrg) {
      return {
        ok: false as const,
        reason: 'org_already_exists' as const,
        orgId: existingOrg._id,
      };
    }

    const now = Date.now();

    // Patch the auth-created user with our profile fields. Convex Auth
    // populates `email` on signup; we mirror it to `fullName` and stamp
    // our own bookkeeping fields.
    await ctx.db.patch(args.userId, {
      email: args.email,
      name: args.fullName,
      fullName: args.fullName,
      mfaEnabled: false,
      createdAt: now,
    });

    // Create the EcoCribs Realty org. `clerkOrgId` is required by the
    // legacy schema but unused under Convex Auth — empty string placeholder
    // until the schema is cleaned up by the agent that owns it.
    const orgId = await ctx.db.insert('orgs', {
      clerkOrgId: '',
      name: 'EcoCribs Realty',
      governingLawDefault: 'lagos',
      createdAt: now,
    });

    // Attach the Principal membership (top of hierarchy).
    const membershipId = await ctx.db.insert('memberships', {
      userId: args.userId,
      orgId,
      role: 'principal',
      status: 'active',
      teamIds: [],
      createdAt: now,
    });

    return { ok: true as const, orgId, membershipId, userId: args.userId };
  },
});
