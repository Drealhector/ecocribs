import { v } from 'convex/values';
import { authedMutation, authedQuery } from './lib/withAuth';
import { recordEvent } from './lib/audit';
import { generateToken, hashToken } from './lib/tokens';
import type { Doc, Id } from './_generated/dataModel';

/**
 * Principal-only admin management.
 *
 * The Principal sits above admin in the role hierarchy:
 *
 *   Principal → Admin → Staff (manager / documentation_officer) → Agent → Customer
 *
 * Principal inherits every admin capability AND is the only role permitted
 * to invite, remove, or re-role other admins. Admins themselves cannot
 * elevate teammates to admin (that path is blocked in `teamInvites.create`).
 *
 * Hard guards enforced here:
 *   - Cannot remove yourself (Principal).
 *   - Cannot remove the last active Principal in the org.
 *   - Cannot change your own role.
 *
 * All write actions append a hash-chained `audit_logs` entry via the shared
 * `recordEvent` helper for tamper-evident accountability.
 */

const TEAM_INVITE_TTL_MS = 72 * 60 * 60 * 1000;

const ChangeRoleArg = v.union(
  v.literal('admin'),
  v.literal('manager'),
  v.literal('documentation_officer'),
  v.literal('agent'),
);

function assertPrincipalOrAdmin(role: string): void {
  if (role !== 'principal' && role !== 'admin') throw new Error('FORBIDDEN');
}

function assertPrincipal(role: string): void {
  if (role !== 'principal') throw new Error('FORBIDDEN_PRINCIPAL_ONLY');
}

/**
 * List all Principal + Admin memberships in the caller's org with the user's
 * profile fields denormalised in. Sorted Principal first, then admins by
 * createdAt ascending. Read access for Principal AND admin (admins can see
 * the team but cannot mutate it).
 */
export const listAdmins = authedQuery({
  args: {},
  handler: async (ctx) => {
    assertPrincipalOrAdmin(ctx.role);

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_org', (q) => q.eq('orgId', ctx.orgId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const adminLike = memberships.filter((m) => m.role === 'principal' || m.role === 'admin');

    const out = [];
    for (const m of adminLike) {
      const u = (await ctx.db.get(m.userId)) as Doc<'users'> | null;
      if (!u) continue;
      out.push({
        membershipId: m._id,
        userId: u._id,
        role: m.role,
        status: m.status,
        fullName: u.fullName ?? u.name ?? u.email ?? null,
        email: u.email ?? null,
        image: u.image ?? u.avatarUrl ?? null,
        createdAt: m.createdAt,
        lastSeenAt: u.lastSeenAt ?? null,
        isSelf: u._id === ctx.user._id,
      });
    }

    // Principals first, then admins by createdAt ASC
    out.sort((a, b) => {
      if (a.role === 'principal' && b.role !== 'principal') return -1;
      if (b.role === 'principal' && a.role !== 'principal') return 1;
      return a.createdAt - b.createdAt;
    });

    return out;
  },
});

/**
 * Principal-only — count active Principals in the caller's org so the UI
 * can disable "remove" / "demote" buttons when there's only one left.
 */
export const countPrincipals = authedQuery({
  args: {},
  handler: async (ctx): Promise<number> => {
    assertPrincipalOrAdmin(ctx.role);
    const rows = await ctx.db
      .query('memberships')
      .withIndex('by_org_role', (q) => q.eq('orgId', ctx.orgId).eq('role', 'principal'))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();
    return rows.length;
  },
});

/**
 * Principal-only — mint a single-use 72h invite token with `role='admin'`
 * baked in. Reuses the `invitations` table the same way `teamInvites.create`
 * does (scope tags carry email / name / role; `purpose='guest_view'` is the
 * existing union member repurposed for "team join").
 *
 * The raw token is returned exactly once. Caller composes the link
 * `https://<host>/team-join?t=<token>` and shares it via WhatsApp/email.
 */
export const inviteAdmin = authedMutation({
  args: {
    fullName: v.string(),
    email: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ link: string; token: string; expiresAt: number; email: string }> => {
    assertPrincipal(ctx.role);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) throw new Error('INVALID_EMAIL');
    const fullName = args.fullName.trim();
    if (!fullName) throw new Error('INVALID_NAME');

    const email = args.email.toLowerCase().trim();
    const token = generateToken();
    const tokenHash = await hashToken(token);
    const expiresAt = Date.now() + TEAM_INVITE_TTL_MS;

    const inviteId = await ctx.db.insert('invitations', {
      orgId: ctx.orgId,
      dealId: '' as unknown as Id<'deals'>, // unused for team invites
      purpose: 'guest_view',
      tokenHash,
      scope: [`team:join:admin`, `team:email:${email}`, `team:name:${fullName}`],
      expiresAt,
      maxUses: 1,
      deliveredVia: ['email'],
      createdBy: ctx.user._id,
      createdAt: Date.now(),
    });

    await recordEvent(ctx, {
      orgId: ctx.orgId,
      actorUserId: ctx.user._id,
      actorRole: ctx.role,
      action: 'admin.invited',
      targetType: 'team_invite',
      targetId: inviteId,
      metadata: { email, fullName, role: 'admin' },
    });

    // Best-effort site origin; the host is injected client-side if SITE_URL
    // isn't configured at deploy time.
    const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');
    const link = siteUrl ? `${siteUrl}/team-join?t=${token}` : `/team-join?t=${token}`;

    return { link, token, expiresAt, email };
  },
});

/**
 * Principal-only — revoke an admin (or principal) membership by flipping
 * status to 'revoked'. Cannot revoke self; cannot revoke the last Principal.
 */
export const removeAdmin = authedMutation({
  args: { membershipId: v.id('memberships') },
  handler: async (ctx, args) => {
    assertPrincipal(ctx.role);

    const target = (await ctx.db.get(args.membershipId)) as Doc<'memberships'> | null;
    if (!target || target.orgId !== ctx.orgId) throw new Error('NOT_FOUND');
    if (target.status !== 'active') throw new Error('ALREADY_REVOKED');
    if (target.userId === ctx.user._id) throw new Error('CANNOT_REMOVE_SELF');

    // Last-Principal guard: if removing a principal, ensure ≥2 remain
    if (target.role === 'principal') {
      const principals = await ctx.db
        .query('memberships')
        .withIndex('by_org_role', (q) => q.eq('orgId', ctx.orgId).eq('role', 'principal'))
        .filter((q) => q.eq(q.field('status'), 'active'))
        .collect();
      if (principals.length <= 1) throw new Error('CANNOT_REMOVE_LAST_PRINCIPAL');
    }

    const now = Date.now();
    await ctx.db.patch(args.membershipId, { status: 'revoked', revokedAt: now });

    await recordEvent(ctx, {
      orgId: ctx.orgId,
      actorUserId: ctx.user._id,
      actorRole: ctx.role,
      action: 'admin.removed',
      targetType: 'membership',
      targetId: args.membershipId,
      metadata: { revokedUserId: target.userId, previousRole: target.role },
    });

    return { ok: true };
  },
});

/**
 * Principal-only — change a teammate's role. Cannot change own role.
 *
 * `newRole` deliberately excludes `'principal'` — promotion to Principal
 * is intentionally not exposed here (would require a separate, careful flow
 * with explicit "transfer ownership" semantics). This also makes the
 * last-Principal demotion case impossible-by-construction: a Principal
 * cannot be demoted via this function because `newRole` cannot target the
 * Principal themselves either (own-role guard) AND there's no path to
 * accidentally demote a Principal you don't own. We still guard against
 * demoting any active Principal (the only Principal who could be targeted
 * is someone other than the caller, and that's still a last-Principal risk
 * if they're the only other one).
 */
export const changeRole = authedMutation({
  args: { membershipId: v.id('memberships'), newRole: ChangeRoleArg },
  handler: async (ctx, args) => {
    assertPrincipal(ctx.role);

    const target = (await ctx.db.get(args.membershipId)) as Doc<'memberships'> | null;
    if (!target || target.orgId !== ctx.orgId) throw new Error('NOT_FOUND');
    if (target.status !== 'active') throw new Error('NOT_ACTIVE');
    if (target.userId === ctx.user._id) throw new Error('CANNOT_CHANGE_OWN_ROLE');
    if (target.role === args.newRole) return { ok: true, unchanged: true as const };

    // Last-Principal guard: demoting a principal requires ≥2 to remain after
    if (target.role === 'principal') {
      const principals = await ctx.db
        .query('memberships')
        .withIndex('by_org_role', (q) => q.eq('orgId', ctx.orgId).eq('role', 'principal'))
        .filter((q) => q.eq(q.field('status'), 'active'))
        .collect();
      if (principals.length <= 1) throw new Error('CANNOT_DEMOTE_LAST_PRINCIPAL');
    }

    const previousRole = target.role;
    await ctx.db.patch(args.membershipId, { role: args.newRole });

    await recordEvent(ctx, {
      orgId: ctx.orgId,
      actorUserId: ctx.user._id,
      actorRole: ctx.role,
      action: 'admin.role_changed',
      targetType: 'membership',
      targetId: args.membershipId,
      metadata: { targetUserId: target.userId, previousRole, newRole: args.newRole },
    });

    return { ok: true, previousRole, newRole: args.newRole };
  },
});
