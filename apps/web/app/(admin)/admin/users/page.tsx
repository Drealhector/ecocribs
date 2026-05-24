'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAction, useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { IS_PREVIEW } from '@/lib/preview';
import {
  UserCircle2, Shield, FileEdit, UserCog,
  UserPlus, Copy, MessageCircle, Mail, AlertCircle, Check,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'agent', label: 'Agent' },
  { value: 'documentation_officer', label: 'Documentation Officer' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
] as const;

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  documentation_officer: 'Documentation Officer',
  agent: 'Agent',
};

const ROLE_ICON: Record<string, any> = {
  admin: Shield,
  manager: UserCog,
  documentation_officer: FileEdit,
  agent: UserCircle2,
};

const PREVIEW_MEMBERS = [
  { fullName: 'Tomi Akinola', email: 'tomi@ecocribsrealty.com', role: 'documentation_officer' },
  { fullName: 'Chinonso Okocha', email: 'ceo@ecocribsrealty.com', role: 'admin' },
  { fullName: 'Folake Bello', email: 'folake@ecocribsrealty.com', role: 'manager' },
  { fullName: 'David Ojo', email: 'david@ecocribsrealty.com', role: 'agent' },
  { fullName: 'Amaka Ude', email: 'amaka@ecocribsrealty.com', role: 'agent' },
];

export default function Team() {
  const live = useQuery(api.users.listStaff, IS_PREVIEW ? 'skip' : {});
  const members = IS_PREVIEW ? PREVIEW_MEMBERS : (live ?? []);

  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]['value']>('agent');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ token: string; email: string; role: string; fullName: string } | null>(null);

  const create = useAction(api.teamInvites.create);

  const resetForm = () => {
    setName(''); setEmail(''); setRole('agent'); setError(null); setResult(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Full name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email.');
    setSubmitting(true);
    try {
      const res = await create({ email: email.trim(), fullName: name.trim(), role });
      setResult({ token: res.token, email: res.email, role: res.role, fullName: name.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invite.');
    } finally {
      setSubmitting(false);
    }
  };

  const inviteLink = result
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://ecocribs-web.vercel.app'}/team-join?t=${result.token}`
    : '';

  return (
    <div className="container py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Team</h1>
          <p className="text-ink-soft mt-1">Admins, managers, documentation officers, and agents.</p>
        </div>
        <Button onClick={() => { setInviting(true); resetForm(); }} className="self-start sm:self-auto">
          <UserPlus className="h-4 w-4" /> Invite teammate
        </Button>
      </div>

      {/* Inline invite drawer */}
      {inviting && (
        <Card className="border-brand-orange/30">
          <CardContent className="pt-6">
            {!result ? (
              <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
                <div>
                  <Label htmlFor="invite-name">Full name</Label>
                  <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tomi Akinola" required />
                </div>
                <div>
                  <Label htmlFor="invite-email">Work email</Label>
                  <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tomi@ecocribsrealty.com" required />
                  <p className="text-2xs text-ink-soft mt-1.5">
                    They&apos;ll set their own password when they join — we never see it.
                  </p>
                </div>
                <div>
                  <Label htmlFor="invite-role">Role</Label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as typeof role)}
                    className="flex h-11 w-full rounded-md border border-border bg-canvas px-3 text-base text-ink focus-visible:outline-none focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange/30"
                  >
                    {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {error && (
                  <p className="text-sm text-danger flex items-start gap-2" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
                  </p>
                )}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => { setInviting(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create invite'}</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 max-w-lg">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green text-white shrink-0">
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  <div>
                    <h3 className="font-heading text-lg">Invite ready for {result.fullName}</h3>
                    <p className="text-sm text-ink-soft mt-1">
                      Share this link with them — one tap and they set their password.
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-canvas-warm p-3 space-y-3">
                  <div className="flex items-center gap-2 rounded-md bg-canvas border border-border-subtle px-3 py-2">
                    <span className="mono text-xs truncate flex-1 text-ink-muted">{inviteLink}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(inviteLink)}
                      className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>
                  <p className="text-2xs text-ink-soft">Expires in 72 hours · single use · email locked to {result.email}</p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Hi ${result.fullName}, you've been invited to join EcoCribs Realty as ${ROLE_LABEL[result.role] ?? result.role}. Open this link to set your password: ${inviteLink}`)}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-green text-white text-sm font-medium px-4 py-2.5 hover:bg-brand-green-deep"
                    >
                      <MessageCircle className="h-4 w-4" /> Open in WhatsApp
                    </a>
                    <a
                      href={`mailto:${result.email}?subject=${encodeURIComponent('You are invited to EcoCribs Realty')}&body=${encodeURIComponent(`Hi ${result.fullName},\n\nYou've been invited to join EcoCribs Realty as ${ROLE_LABEL[result.role] ?? result.role}.\n\nOpen this link to set your password and join the team:\n${inviteLink}\n\nThis link expires in 72 hours.\n\n— EcoCribs Realty`)}`}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-canvas text-ink text-sm font-medium px-4 py-2.5 hover:bg-canvas-warm"
                    >
                      <Mail className="h-4 w-4" /> Open in email
                    </a>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <Button variant="outline" onClick={() => { setInviting(false); resetForm(); }}>Done</Button>
                  <Button onClick={resetForm}>Invite another</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Member list */}
      <Card>
        <CardContent className="pt-6">
          {members.length === 0 ? (
            <p className="py-12 text-center text-ink-soft text-sm">
              No teammates yet. Click <strong>Invite teammate</strong> above to add the first one.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((m: any) => {
                const Icon = ROLE_ICON[m.role] ?? UserCircle2;
                return (
                  <div key={m.email} className="flex items-center gap-3 p-3 rounded-md hover:bg-canvas-warm">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-soft text-brand-green shrink-0">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">{m.fullName}</p>
                      <p className="text-xs text-ink-soft truncate">{m.email}</p>
                    </div>
                    <span className="text-xs font-medium text-ink-muted bg-canvas-warm px-2 py-1 rounded-pill shrink-0">
                      {ROLE_LABEL[m.role] ?? m.role}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
