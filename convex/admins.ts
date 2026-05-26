import { v } from 'convex/values';
import { authedMutation, authedQuery } from './lib/withAuth';
import { recordEvent } from './lib/audit';
import { generateToken, hashToken } from './lib/tokens';
import type { Doc, Id } from './_generated/dataModel';

/**
 * Principal-only admin management.
 *
 * Hierarchy: Principal → Admin → Staff → Agent → Customer.
 * Principal inherits every admin capability AND is the only role
 * permitted to invite or revoke other admins.
 *
 * Hard guards:
 *   - Cannot revoke yourself.
 *   - Cannot revoke the last active Principal.
 */
const TEAM_INVITE_TTL_MS = 72 * 60 * 60 * 1000;

function assertPrincipalOrAdmin(role: string): void {
  if (role !== 'principal' && role !== 'admin') throw new Error('FORBIDDEN');
}
function assertPrincipal(role: string): void {
  if (role !== 'principal') throw new Error('FORBIDDEN_PRINCIPAL_ONLY');
}

/**
 * List active Principal + Admin memberships in the caller's org with the
 * user's profile fields denormalised in. Sorted Principal first.
 * Read access for Principal AND admin.
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

    const out = [];
    for (const m of memberships) {
      if (m.role !== 'principal' && m.role !== 'admin') continue;
      const u = (await ctx.db.get(m.userId)) as Doc<'users'> | null;
      if (!u) continue;
      out.push({
        membershipId: m._id,
        userId: u._id,
        role: m.role,
        fullName: u.fullName ?? u.name ?? u.email ?? null,
        email: u.email ?? null,
        image: u.image ?? u.avatarUrl ?? null,
        createdAt: m.createdAt,
        lastSeenAt: u.lastSeenAt ?? null,
        isSelf: u._id === ctx.user._id,
      });
    }

    out.sort((a, b) => {
      if (a.role === 'principal' && b.role !== 'principal') return -1;
      if (b.role === 'principal' && a.role !== 'principal') return 1;
      return a.createdAt - b.createdAt;
    });

    return out;
  },
});

/**
 * Principal-only — mint a single-use 72h invite token with role='admin'
 * baked into the scope tags. Returns the raw token exactly once.
 */
export const inviteAdmin = authedMutation({
  args: { fullName: v.string(), email: v.string() },
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
      dealId: '' as unknown as Id<'deals'>,
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

    const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');
    const link = siteUrl ? `${siteUrl}/team-join?t=${token}` : `/team-join?t=${token}`;
    return { link, token, expiresAt, email };
  },
});

/**
 * Principal-only — revoke an admin (or principal) membership.
 * Blocks self-revocation and last-Principal removal.
 */
export const removeAdmin = authedMutation({
  args: { membershipId: v.id('memberships') },
  handler: async (ctx, args) => {
    assertPrincipal(ctx.role);

    const target = (await ctx.db.get(args.membershipId)) as Doc<'memberships'> | null;
    if (!target || target.orgId !== ctx.orgId) throw new Error('NOT_FOUND');
    if (target.status !== 'active') throw new Error('ALREADY_REVOKED');
    if (target.userId === ctx.user._id) throw new Error('CANNOT_REMOVE_SELF');

    if (target.role === 'principal') {
      const principals = await ctx.db
        .query('memberships')
        .withIndex('by_org_role', (q) => q.eq('orgId', ctx.orgId).eq('role', 'principal'))
        .filter((q) => q.eq(q.field('status'), 'active'))
        .collect();
      if (principals.length <= 1) throw new Error('CANNOT_REMOVE_LAST_PRINCIPAL');
    }

    await ctx.db.patch(args.membershipId, { status: 'revoked', revokedAt: Date.now() });

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
