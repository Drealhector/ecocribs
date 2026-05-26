import { v } from 'convex/values';
import { authedAction, type Role } from './lib/withAuth';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { recordEvent } from './lib/audit';
import { generateToken, hashToken } from './lib/tokens';
import type { Id } from './_generated/dataModel';

const TEAM_INVITE_TTL_MS = 72 * 60 * 60 * 1000;

const RoleArg = v.union(
  v.literal('admin'),
  v.literal('manager'),
  v.literal('documentation_officer'),
  v.literal('agent'),
);

/**
 * Admin (or manager) invites a new teammate. Returns the raw token exactly
 * once so the caller can share the link via WhatsApp/email. Email is locked
 * into the invite — recipient can't swap it. Role is locked too — recipient
 * can't elevate themselves.
 */
export const create = authedAction({
  args: {
    email: v.string(),
    fullName: v.string(),
    role: RoleArg,
  },
  handler: async (ctx, args): Promise<{
    token: string;
    expiresAt: number;
    email: string;
    role: Role;
  }> => {
    if (ctx.role !== 'principal' && ctx.role !== 'admin' && ctx.role !== 'manager') {
      throw new Error('FORBIDDEN');
    }
    // Only Principal can invite/onboard fellow admins via the generic team
    // invite path; admins.ts.inviteAdmin is the dedicated Principal-only flow.
    if (args.role === 'admin' && ctx.role !== 'principal') {
      throw new Error('FORBIDDEN_ONLY_PRINCIPAL_CAN_INVITE_ADMIN');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
      throw new Error('INVALID_EMAIL');
    }
    if (!args.fullName.trim()) throw new Error('INVALID_NAME');

    const token = generateToken();
    const tokenHash = await hashToken(token);
    const expiresAt = Date.now() + TEAM_INVITE_TTL_MS;

    await ctx.runMutation(internal.teamInvites._commit, {
      orgId: ctx.orgId,
      email: args.email.toLowerCase().trim(),
      fullName: args.fullName.trim(),
      role: args.role,
      tokenHash,
      expiresAt,
      createdBy: ctx.user._id,
      actorRole: ctx.role,
    });

    return { token, expiresAt, email: args.email.toLowerCase().trim(), role: args.role };
  },
});

export const _commit = internalMutation({
  args: {
    orgId: v.id('orgs'),
    email: v.string(),
    fullName: v.string(),
    role: RoleArg,
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdBy: v.id('users'),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('invitations', {
      orgId: args.orgId,
      dealId: '' as unknown as Id<'deals'>, // unused for team invites
      purpose: 'guest_view', // reuse existing union — semantically "team join"
      tokenHash: args.tokenHash,
      scope: [`team:join:${args.role}`, `team:email:${args.email}`, `team:name:${args.fullName}`],
      expiresAt: args.expiresAt,
      maxUses: 1,
      deliveredVia: ['email'],
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    await recordEvent(ctx, {
      orgId: args.orgId,
      actorUserId: args.createdBy,
      actorRole: args.actorRole,
      action: 'invite.create',
      targetType: 'team_invite',
      targetId: id,
      metadata: { email: args.email, role: args.role },
    });

    return id;
  },
});

/**
 * Public query — fetch the invite preview (email, role, org name) for the
 * /team-join page so it can show the recipient what they're accepting.
 */
export const peek = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.token);
    const invite = await ctx.db
      .query('invitations')
      .withIndex('by_token', (q) => q.eq('tokenHash', tokenHash))
      .unique();
    if (!invite) return null;
    if (invite.usedAt || invite.revokedAt) return { status: 'used' as const };
    if (Date.now() > invite.expiresAt) return { status: 'expired' as const };

    // Decode scope tags
    const email = invite.scope.find((s) => s.startsWith('team:email:'))?.slice('team:email:'.length) ?? null;
    const fullName = invite.scope.find((s) => s.startsWith('team:name:'))?.slice('team:name:'.length) ?? null;
    const role = invite.scope.find((s) => s.startsWith('team:join:'))?.slice('team:join:'.length) ?? null;
    if (!email || !role) return null;

    const org = await ctx.db.get(invite.orgId);
    return {
      status: 'valid' as const,
      email,
      fullName,
      role,
      orgName: org?.name ?? 'EcoCribs Realty',
      expiresAt: invite.expiresAt,
    };
  },
});

/**
 * Public mutation — called by the just-signed-up teammate to consume the
 * invite. Validates token + email match + not used, creates membership
 * with the role the inviter assigned, marks invite used. Atomic.
 */
export const consume = mutation({
  args: { token: v.string(), userId: v.id('users') },
  handler: async (ctx, args) => {
    const tokenHash = await hashToken(args.token);
    const invite = await ctx.db
      .query('invitations')
      .withIndex('by_token', (q) => q.eq('tokenHash', tokenHash))
      .unique();
    if (!invite) throw new Error('INVALID_OR_EXPIRED');
    if (invite.usedAt || invite.revokedAt) throw new Error('INVALID_OR_EXPIRED');
    if (Date.now() > invite.expiresAt) throw new Error('INVALID_OR_EXPIRED');

    const inviteEmail = invite.scope.find((s) => s.startsWith('team:email:'))?.slice('team:email:'.length);
    const role = invite.scope.find((s) => s.startsWith('team:join:'))?.slice('team:join:'.length) as Role | undefined;
    if (!inviteEmail || !role) throw new Error('INVALID_OR_EXPIRED');

    // Confirm the email on the signed-up user matches the invite email
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    if ((user.email ?? '').toLowerCase() !== inviteEmail.toLowerCase()) {
      throw new Error('EMAIL_MISMATCH');
    }

    // Anyone for this org with this user already? Don't double-add
    const existing = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) => q.eq('userId', args.userId).eq('orgId', invite.orgId))
      .unique();
    if (existing) {
      await ctx.db.patch(invite._id, { usedAt: Date.now() });
      return { orgId: invite.orgId, role: existing.role };
    }

    // Patch fullName onto the user if it wasn't set during signup
    const fullName = invite.scope.find((s) => s.startsWith('team:name:'))?.slice('team:name:'.length);
    if (fullName && !user.fullName) {
      await ctx.db.patch(args.userId, { fullName });
    }

    const memId = await ctx.db.insert('memberships', {
      userId: args.userId,
      orgId: invite.orgId,
      role,
      status: 'active',
      teamIds: [],
      invitedBy: invite.createdBy,
      createdAt: Date.now(),
    });

    await ctx.db.patch(invite._id, { usedAt: Date.now() });

    await recordEvent(ctx, {
      orgId: invite.orgId,
      actorUserId: args.userId,
      actorRole: role,
      action: 'invite.accept',
      targetType: 'membership',
      targetId: memId,
      metadata: { inviteId: invite._id, email: inviteEmail },
    });

    return { orgId: invite.orgId, role };
  },
});
