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
import { UserPlus, Trash2, Copy, Check, Mail, MessageCircle, Shield, AlertCircle } from 'lucide-react';

type AdminRole = 'principal' | 'admin';
type AdminRow = {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  joinedAt: number;
  lastSeenAt: number;
};

const SEED_ADMINS: AdminRow[] = [
  { id: 'mem_001', fullName: 'Adesola Adeyemi', email: 'adesola@ecocribsrealty.com', role: 'principal', joinedAt: Date.now() - 365 * 86400_000, lastSeenAt: Date.now() - 15 * 60_000 },
  { id: 'mem_002', fullName: 'Funmi Bello', email: 'funmi@ecocribsrealty.com', role: 'admin', joinedAt: Date.now() - 180 * 86400_000, lastSeenAt: Date.now() - 2 * 60 * 60_000 },
  { id: 'mem_003', fullName: 'Kunle Adeyemi', email: 'kunle@ecocribsrealty.com', role: 'admin', joinedAt: Date.now() - 95 * 86400_000, lastSeenAt: Date.now() - 86400_000 },
];

export default function PrincipalAdminsPage() {
  return (
    <Suspense fallback={null}>
      <AdminsInner />
    </Suspense>
  );
}

function AdminsInner() {
  const adminsApi = (api as any).admins;
  const liveAdmins = useQuery(adminsApi?.listAdmins, IS_PREVIEW ? 'skip' : {});
  const inviteAdmin = useMutation(adminsApi?.inviteAdmin);
  const removeAdmin = useMutation(adminsApi?.removeAdmin);

  const [admins, setAdmins] = useState<AdminRow[]>(SEED_ADMINS);
  const rows = IS_PREVIEW ? admins : (liveAdmins ?? admins);

  return (
    <div className="container py-6 sm:py-8 space-y-6">
      <header>
        <h1 className="font-heading text-3xl">Admins</h1>
        <p className="text-ink-soft mt-1">Invite new admins or revoke access. Admins can do everything except manage other admins.</p>
      </header>

      <InviteAdminCard
        onInvite={async ({ fullName, email }) => {
          if (IS_PREVIEW) {
            const token = 'demo_' + Math.random().toString(36).slice(2, 8);
            return { link: `https://portal.ecocribsrealty.com/team-join?t=${token}`, expiresAt: Date.now() + 72 * 60 * 60_000 };
          }
          return (await inviteAdmin({ fullName, email })) as { link: string; expiresAt: number };
        }}
      />

      <ActiveAdminsCard
        rows={rows}
        onRevoke={async (row) => {
          if (!confirm(`Revoke ${row.fullName}'s access? They won't be able to sign in.`)) return;
          if (IS_PREVIEW) {
            setAdmins((prev) => prev.filter((r) => r.id !== row.id));
            return;
          }
          await removeAdmin({ membershipId: row.id as any });
        }}
      />
    </div>
  );
}

function InviteAdminCard({
  onInvite,
}: {
  onInvite: (args: { fullName: string; email: string }) => Promise<{ link: string; expiresAt: number }>;
}) {
  const params = useSearchParams();
  const nameRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ link: string; expiresAt: number; fullName: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (params.get('invite') === '1') nameRef.current?.focus(); }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError('Full name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
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
    } catch { /* clipboard blocked */ }
  };

  return (
    <Card className="border-brand-green/30">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-green-soft text-brand-green shrink-0">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl">Invite an admin</h2>
            <p className="text-sm text-ink-soft mt-0.5">They&apos;ll get a single-use link valid for 72 hours.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="admin-name">Full name</Label>
            <Input id="admin-name" ref={nameRef} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Funmi Bello" required />
          </div>
          <div className="flex-1">
            <Label htmlFor="admin-email">Work email</Label>
            <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="funmi@ecocribsrealty.com" required />
          </div>
          <Button type="submit" variant="secondary" disabled={submitting} className="md:self-end">
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
            <p className="font-heading text-base text-ink">
              <Check className="inline h-4 w-4 text-brand-green mr-1" strokeWidth={2.5} /> Invite ready
              <span className="ml-2 text-xs text-ink-soft font-normal">expires {relativeTime(result.expiresAt)}</span>
            </p>

            <div className="flex items-center gap-2 rounded-md bg-canvas border border-border-subtle px-3 py-2">
              <span className="mono text-xs truncate flex-1 text-ink-muted">{result.link}</span>
              <button type="button" onClick={copyLink} className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline shrink-0">
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hi ${result.fullName}, you've been invited to join EcoCribs Realty as an Admin. Open this link within 72 hours: ${result.link}`)}`}
                target="_blank" rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-green text-white text-sm font-medium px-4 py-2.5 hover:bg-brand-green-deep"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a
                href={`mailto:${encodeURIComponent(result.email)}?subject=${encodeURIComponent('Admin invite to EcoCribs Realty')}&body=${encodeURIComponent(`Hi ${result.fullName},\n\nOpen this link within 72 hours to join EcoCribs Realty as an Admin:\n${result.link}`)}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-canvas text-ink text-sm font-medium px-4 py-2.5 hover:bg-canvas-warm"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveAdminsCard({ rows, onRevoke }: { rows: AdminRow[]; onRevoke: (row: AdminRow) => Promise<void> }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="font-heading text-xl mb-4">Active admins <span className="text-xs text-ink-soft font-normal">({rows.length})</span></h2>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {rows.map((r) => {
            const isPrincipal = r.role === 'principal';
            return (
              <div key={r.id} className="rounded-md border border-border-subtle p-3">
                <div className="flex items-start gap-3">
                  <Avatar name={r.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate flex items-center gap-2">
                      {r.fullName} {isPrincipal && <YouPill />}
                    </p>
                    <p className="text-xs text-ink-soft truncate">{r.email}</p>
                    <div className="mt-1.5"><RoleBadge role={r.role} /></div>
                  </div>
                </div>
                {!isPrincipal && (
                  <button
                    type="button"
                    onClick={() => onRevoke(r)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-danger/30 bg-canvas text-danger text-xs font-medium px-3 py-2 hover:bg-danger/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Revoke access
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block -mx-2 overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-ink-soft border-b border-border-subtle">
                <th className="text-left font-medium pb-2 px-2">Admin</th>
                <th className="text-left font-medium pb-2 px-2">Role</th>
                <th className="text-left font-medium pb-2 px-2">Joined</th>
                <th className="text-left font-medium pb-2 px-2">Last seen</th>
                <th className="text-right font-medium pb-2 px-2 w-32"></th>
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
                            {r.fullName} {isPrincipal && <YouPill />}
                          </p>
                          <p className="text-xs text-ink-soft truncate">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2"><RoleBadge role={r.role} /></td>
                    <td className="py-3 px-2 text-sm text-ink-soft">{relativeTime(r.joinedAt)}</td>
                    <td className="py-3 px-2 text-sm text-ink-soft">{relativeTime(r.lastSeenAt)}</td>
                    <td className="py-3 px-2 text-right">
                      {!isPrincipal && (
                        <button
                          type="button"
                          onClick={() => onRevoke(r)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-canvas text-danger text-xs font-medium px-3 py-1.5 hover:bg-danger/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('');
  return (
    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-soft text-brand-green text-sm font-semibold shrink-0" aria-hidden>
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
  return <span className="inline-flex items-center rounded-pill bg-canvas-warm text-ink-soft text-2xs font-medium px-2 py-0.5">You</span>;
}
