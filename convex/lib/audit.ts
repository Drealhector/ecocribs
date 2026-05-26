import type { Id } from '../_generated/dataModel';

/**
 * Write-only audit log. Each action insert is append-only.
 * Retention: 7 years.
 */
export type AuditAction =
  | 'deal.create'
  | 'deal.transition'
  | 'deal.override'
  | 'deal.archive'
  | 'doc.generate'
  | 'doc.send'
  | 'doc.view'
  | 'doc.download'
  | 'doc.sign'
  | 'doc.upload'
  | 'doc.delete'
  | 'invite.create'
  | 'invite.accept'
  | 'invite.revoke'
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'perm.grant'
  | 'perm.revoke'
  | 'admin.invited'
  | 'admin.removed';

export async function recordEvent(
  ctx: any,
  args: {
    orgId: Id<'orgs'>;
    actorUserId?: Id<'users'>;
    actorParticipantId?: Id<'participants'>;
    actorRole: string;
    action: AuditAction;
    targetType: string;
    targetId: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<Id<'audit_logs'>> {
  return await ctx.db.insert('audit_logs', { ...args, at: Date.now(), hashChain: '' });
}
