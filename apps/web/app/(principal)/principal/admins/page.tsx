'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { relativeTime } from '@/lib/format';
import { IS_PREVIEW } from '@/lib/preview';
import {
  UserPlus, MoreVertical, Trash2, ArrowDown, Copy, Check, Mail,
  MessageCircle, Shield, AlertCircle, X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types & seed data
// ─────────────────────────────────────────────────────────────────────────────
type AdminRole = 'principal' | 'admin';
type AdminStatus = 'active' | 'invited' | 'revoked';
type StaffSubRole = 'manager' | 'documentation_officer';

type AdminRow = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: AdminRole;
  joinedAt: number;
  lastSeenAt: number;
  status: AdminStatus;
};

const SEED_ADMINS: AdminRow[] = [
  { id: 'mem_001', userId: 'usr_001', fullName: 'Adesola Adeyemi', email: 'adesola@ecocribsrealty.com', role: 'principal' as const, joinedAt: Date.now() - 365 * 86400_000, lastSeenAt: Date.now() - 15 * 60_000, status: 'active' as const },
  { id: 'mem_002', userId: 'usr_002', fullName: 'Funmi Bello', email: 'funmi@ecocribsrealty.com', role: 'admin' as const, joinedAt: Date.now() - 180 * 86400_000, lastSeenAt: Date.now() - 2 * 60 * 60_000, status: 'active' as const },
  { id: 'mem_003', userId: 'usr_003', fullName: 'Kunle Adeyemi', email: 'kunle@ecocribsrealty.com', role: 'admin' as const, joinedAt: Date.now() - 95 * 86400_000, lastSeenAt: Date.now() - 1 * 86400_000, status: 'active' as const },
];

const STAFF_ROLE_LABEL: Record<StaffSubRole, string> = {
  manager: 'Manager',
  documentation_officer: 'Documentation officer',
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PrincipalAdminsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminsInner />
    </Suspense>
  );
}

function AdminsInner() {
  // ── Convex hooks (skipped in preview). Future swap: drop the `as any` once
  // the sibling agent ships `convex/admins.ts` and `npx convex codegen`
  // regenerates `api.d.ts` with the `admins` namespace.
  const adminsApi = (api as any).admins;
  const liveAdmins = useQuery(adminsApi?.listAdmins, IS_PREVIEW ? 'skip' : {});
  const inviteAdmin = useMutation(adminsApi?.inviteAdmin);
  const removeAdmin = useMutation(adminsApi?.removeAdmin);
  const changeRole = useMutation(adminsApi?.changeRole);

  // Local state mirrors what the server would return — single source of truth
  // in preview; in prod, swap to `liveAdmins ?? []` and call the mutations.
  const [admins, setAdmins] = useState<AdminRow[]>(SEED_ADMINS);
  const rows = IS_PREVIEW ? admins : (liveAdmins ?? admins);

  return (
    <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8">
      <header>
        <p className="text-2xs uppercase tracking-wider text-brand-gold font-medium">Principal</p>
        <h1 className="font-heading text-3xl mt-1">Admins</h1>
        <p className="text-ink-soft mt-1 max-w-2xl">
          Invite new admins, change roles, or revoke access. Admins can do everything except manage other admins.
        </p>
      </header>

      <InviteAdminCard
        onInvite={async ({ fullName, email }) => {
          if (IS_PREVIEW) {
            const token = 'demo_' + Math.random().toString(36).slice(2, 8);
            const link = `https://portal.ecocribsrealty.com/team-join?t=${token}`;
            const expiresAt = Date.now() + 72 * 60 * 60_000;
            return { link, expiresAt };
          }
          const res = await inviteAdmin({ fullName, email });
          return res as { link: string; expiresAt: number };
        }}
      />

      <ActiveAdminsCard
        rows={rows}
        onChangeRole={async (row, subRole) => {
          if (IS_PREVIEW) {
            setAdmins((prev) => prev.filter((r) => r.id !== row.id));
            return;
          }
          await changeRole({ memberId: row.id as any, role: subRole });
        }}
        onRevoke={async (row) => {
          if (IS_PREVIEW) {
            setAdmins((prev) => prev.filter((r) => r.id !== row.id));
            return;
          }
          await removeAdmin({ memberId: row.id as any });
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Invite admin card
// ─────────────────────────────────────────────────────────────────────────────
function InviteAdminCard({
  onInvite,
}: {
  onInvite: (args: { fullName: string; email: string }) => Promise<{ link: string; expiresAt: number }>;
}) {
  const params = useSearchParams();
  const autoFocus = params.get('invite') === '1';
  const nameRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ link: string; expiresAt: number; fullName: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);

  const reset = () => {
    setFullName(''); setEmail(''); setError(null); setResult(null); setCopied(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setSubmitting(true);
    try {
      const res = await onInvite({ fullName: fullName.trim(), email: email.trim() });
      setResult({ ...res, fullName: fullName.trim(), email: email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — fail silently
    }
  };

  return (
    <Card className="border-brand-green/30">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4 flex-wrap">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-green-soft text-brand-green shrink-0">
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-xl">Invite an admin</h2>
            <p className="text-sm text-ink-soft mt-0.5">
              They&apos;ll get a single-use link valid for 72 hours.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="admin-name">Full name</Label>
            <Input
              id="admin-name"
              ref={nameRef}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Funmi Bello"
              autoComplete="off"
              required
            />
          </div>
          <div className="flex-1 min-w-0">
            <Label htmlFor="admin-email">Work email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="funmi@ecocribsrealty.com"
              autoComplete="off"
              required
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={submitting}
            className="md:self-end shrink-0"
          >
            {submitting ? 'Sending…' : 'Send invite'}
          </Button>
        </form>

        {error && (
          <p className="mt-3 text-sm text-danger flex items-start gap-2" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
          </p>
        )}

        {result && (
          <div className="mt-5 rounded-md border border-brand-green/30 bg-brand-green-soft/50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-green text-white shrink-0">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-base text-ink">Invite ready</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  Share with {result.fullName} · expires {relativeTime(result.expiresAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-canvas border border-border-subtle px-3 py-2">
              <span className="mono text-xs truncate flex-1 text-ink-muted">{result.link}</span>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline shrink-0"
                aria-label="Copy invite link"
              >
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hi ${result.fullName}, you've been invited to join EcoCribs Realty as an Admin. Open this link within 72 hours to set your password: ${result.link}`,
                )}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-green text-white text-sm font-medium px-4 py-2.5 hover:bg-brand-green-deep"
              >
                <MessageCircle className="h-4 w-4" /> Open in WhatsApp
              </a>
              <a
                href={`mailto:${encodeURIComponent(result.email)}?subject=${encodeURIComponent(
                  'Admin invite to EcoCribs Realty',
                )}&body=${encodeURIComponent(
                  `Hi ${result.fullName},\n\nYou've been invited to join EcoCribs Realty as an Admin.\n\nOpen this link within 72 hours to set your password and join:\n${result.link}\n\n— EcoCribs Realty`,
                )}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-canvas text-ink text-sm font-medium px-4 py-2.5 hover:bg-canvas-warm"
              >
                <Mail className="h-4 w-4" /> Open in email
              </a>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 rounded-md text-ink-soft text-sm font-medium px-4 py-2.5 hover:text-ink hover:bg-canvas-warm sm:ml-auto"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active admins table / cards
// ─────────────────────────────────────────────────────────────────────────────
function ActiveAdminsCard({
  rows,
  onChangeRole,
  onRevoke,
}: {
  rows: AdminRow[];
  onChangeRole: (row: AdminRow, subRole: StaffSubRole) => Promise<void>;
  onRevoke: (row: AdminRow) => Promise<void>;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [changeFor, setChangeFor] = useState<AdminRow | null>(null);
  const [revokeFor, setRevokeFor] = useState<AdminRow | null>(null);

  const closeAll = () => { setOpenMenuId(null); };

  // Close any open menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => closeAll();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [openMenuId]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-heading text-xl">Active admins</h2>
          <p className="text-xs text-ink-soft">{rows.length} {rows.length === 1 ? 'person' : 'people'}</p>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {rows.map((r) => (
            <AdminMobileCard
              key={r.id}
              row={r}
              onChangeRoleClick={() => setChangeFor(r)}
              onRevokeClick={() => setRevokeFor(r)}
            />
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block -mx-2 overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-ink-soft border-b border-border-subtle">
                <th className="text-left font-medium pb-2 px-2">Admin</th>
                <th className="text-left font-medium pb-2 px-2">Role</th>
                <th className="text-left font-medium pb-2 px-2">Joined</th>
                <th className="text-left font-medium pb-2 px-2">Last seen</th>
                <th className="text-right font-medium pb-2 px-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isPrincipal = r.role === 'principal';
                return (
                  <tr key={r.id} className="border-b border-border-subtle last:border-0 hover:bg-canvas-warm">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={r.fullName} />
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate flex items-center gap-2">
                            {r.fullName}
                            {isPrincipal && <YouPill />}
                          </p>
                          <p className="text-xs text-ink-soft truncate">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2"><RoleBadge role={r.role} /></td>
                    <td className="py-3 px-2 text-sm text-ink-soft">{relativeTime(r.joinedAt)}</td>
                    <td className="py-3 px-2 text-sm text-ink-soft">{relativeTime(r.lastSeenAt)}</td>
                    <td className="py-3 px-2 text-right relative">
                      {isPrincipal ? (
                        <span className="text-2xs text-ink-soft italic">—</span>
                      ) : (
                        <RowMenu
                          open={openMenuId === r.id}
                          onToggle={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === r.id ? null : r.id);
                          }}
                          onChangeRole={() => { setOpenMenuId(null); setChangeFor(r); }}
                          onRevoke={() => { setOpenMenuId(null); setRevokeFor(r); }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Change role dialog */}
      {changeFor && (
        <ChangeRoleDialog
          row={changeFor}
          onClose={() => setChangeFor(null)}
          onConfirm={async (subRole) => {
            await onChangeRole(changeFor, subRole);
            setChangeFor(null);
          }}
        />
      )}

      {/* Revoke confirm dialog */}
      {revokeFor && (
        <RevokeDialog
          row={revokeFor}
          onClose={() => setRevokeFor(null)}
          onConfirm={async () => {
            await onRevoke(revokeFor);
            setRevokeFor(null);
          }}
        />
      )}
    </Card>
  );
}

function AdminMobileCard({
  row,
  onChangeRoleClick,
  onRevokeClick,
}: {
  row: AdminRow;
  onChangeRoleClick: () => void;
  onRevokeClick: () => void;
}) {
  const isPrincipal = row.role === 'principal';
  return (
    <div className="rounded-md border border-border-subtle p-3">
      <div className="flex items-start gap-3">
        <Avatar name={row.fullName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-ink truncate">{row.fullName}</p>
            {isPrincipal && <YouPill />}
          </div>
          <p className="text-xs text-ink-soft truncate">{row.email}</p>
          <div className="mt-1.5"><RoleBadge role={row.role} /></div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-2xs text-ink-soft">
        <span>Joined {relativeTime(row.joinedAt)}</span>
        <span>Last seen {relativeTime(row.lastSeenAt)}</span>
      </div>
      {!isPrincipal && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onChangeRoleClick}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-canvas text-ink text-xs font-medium px-3 py-2 hover:bg-canvas-warm"
          >
            <ArrowDown className="h-3.5 w-3.5" /> Change to staff
          </button>
          <button
            type="button"
            onClick={onRevokeClick}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-danger/30 bg-canvas text-danger text-xs font-medium px-3 py-2 hover:bg-danger/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Revoke
          </button>
        </div>
      )}
    </div>
  );
}

function RowMenu({
  open,
  onToggle,
  onChangeRole,
  onRevoke,
}: {
  open: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onChangeRole: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-canvas-warm hover:text-ink"
        aria-label="Open actions menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1 z-10 w-56 rounded-md border border-border bg-canvas shadow-soft py-1 text-left"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onChangeRole}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-canvas-warm"
          >
            <ArrowDown className="h-4 w-4 text-ink-soft" />
            Change to staff
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onRevoke}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" />
            Revoke access
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialogs
// ─────────────────────────────────────────────────────────────────────────────
function ChangeRoleDialog({
  row,
  onClose,
  onConfirm,
}: {
  row: AdminRow;
  onClose: () => void;
  onConfirm: (subRole: StaffSubRole) => Promise<void>;
}) {
  const [subRole, setSubRole] = useState<StaffSubRole>('manager');
  const [submitting, setSubmitting] = useState(false);

  const confirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(subRole);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogShell onClose={onClose} titleId="change-role-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-green-soft text-brand-green shrink-0">
          <ArrowDown className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 id="change-role-title" className="font-heading text-lg text-ink">Change {row.fullName} to staff</h3>
          <p className="text-sm text-ink-soft mt-1">
            They&apos;ll lose admin access. Pick the staff sub-role they should have.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {(['manager', 'documentation_officer'] as StaffSubRole[]).map((opt) => (
          <label
            key={opt}
            className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
              subRole === opt ? 'border-brand-green bg-brand-green-soft/50' : 'border-border-subtle hover:bg-canvas-warm'
            }`}
          >
            <input
              type="radio"
              name="sub-role"
              value={opt}
              checked={subRole === opt}
              onChange={() => setSubRole(opt)}
              className="mt-1 h-4 w-4 accent-brand-green"
            />
            <div>
              <p className="text-sm font-medium text-ink">{STAFF_ROLE_LABEL[opt]}</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {opt === 'manager'
                  ? 'Sees the team and assigned agents, can run commissions.'
                  : 'Handles document preparation and signing for assigned deals.'}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="secondary" onClick={confirm} disabled={submitting}>
          {submitting ? 'Updating…' : `Change to ${STAFF_ROLE_LABEL[subRole]}`}
        </Button>
      </div>
    </DialogShell>
  );
}

function RevokeDialog({
  row,
  onClose,
  onConfirm,
}: {
  row: AdminRow;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const confirm = async () => {
    setSubmitting(true);
    try { await onConfirm(); } finally { setSubmitting(false); }
  };
  return (
    <DialogShell onClose={onClose} titleId="revoke-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-danger/10 text-danger shrink-0">
          <Trash2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 id="revoke-title" className="font-heading text-lg text-ink">Revoke access?</h3>
          <p className="text-sm text-ink-soft mt-1">
            {row.fullName} won&apos;t be able to sign in. You can re-invite them later if needed.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="danger" onClick={confirm} disabled={submitting}>
          {submitting ? 'Revoking…' : 'Revoke access'}
        </Button>
      </div>
    </DialogShell>
  );
}

function DialogShell({
  onClose,
  titleId,
  children,
}: {
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-canvas shadow-soft p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-canvas-warm hover:text-ink"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small visual atoms
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <span
      className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-soft text-brand-green text-sm font-semibold shrink-0"
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function RoleBadge({ role }: { role: AdminRole }) {
  if (role === 'principal') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-brand-gold text-white text-2xs font-semibold uppercase tracking-wider px-2 py-1">
        <Shield className="h-3 w-3" /> Principal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-brand-green/40 text-brand-green text-2xs font-semibold uppercase tracking-wider px-2 py-1">
      <Shield className="h-3 w-3" /> Admin
    </span>
  );
}

function YouPill() {
  return (
    <span className="inline-flex items-center rounded-pill bg-canvas-warm text-ink-soft text-2xs font-medium px-2 py-0.5">
      You
    </span>
  );
}

function Loading() {
  return (
    <div className="container py-8 space-y-4">
      <div className="h-8 w-48 bg-canvas-warm rounded animate-pulse" />
      <div className="h-32 bg-canvas-warm rounded-md animate-pulse" />
      <div className="h-64 bg-canvas-warm rounded-md animate-pulse" />
    </div>
  );
}
