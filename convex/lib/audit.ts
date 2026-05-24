import type { Id } from '../_generated/dataModel';

/**
 * Tamper-evident audit log.
 *
 * Each row's `hashChain` = sha256(prevRow.hashChain || canonicalize(thisRow)).
 * If any row is mutated or deleted, all downstream hashes diverge from a
 * recomputation. Verified periodically by an internal action.
 *
 * Never exposed for update or delete. Retention: 7 years (NDPR + buffer).
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
  | 'doc.legal_hold_set'
  | 'doc.legal_hold_clear'
  | 'invite.create'
  | 'invite.accept'
  | 'invite.revoke'
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'perm.grant'
  | 'perm.revoke'
  | 'data.export'
  | 'kyc.submit'
  | 'kyc.verify';

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function canonicalize(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj as object).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k]))
      .join(',') +
    '}'
  );
}

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
  const at = Date.now();

  const prev = await ctx.db
    .query('audit_logs')
    .withIndex('by_org_at', (q: any) => q.eq('orgId', args.orgId))
    .order('desc')
    .first();

  const prevHash = (prev as { hashChain?: string } | null)?.hashChain ?? '';
  const rowBody = canonicalize({ ...args, at });
  const hashChain = await sha256Hex(prevHash + rowBody);

  return await ctx.db.insert('audit_logs', { ...args, at, hashChain });
}
