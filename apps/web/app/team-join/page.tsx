'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@/lib/convex-hooks';
import { useAuthActions } from '@/lib/auth-hooks';
import { api } from '@convex/_generated/api';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { ShieldCheck, AlertCircle, Mail, Briefcase } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  documentation_officer: 'Documentation Officer',
  agent: 'Agent',
};

function TeamJoinInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('t') ?? '';
  const peek = useQuery(api.teamInvites.peek, token ? { token } : 'skip');
  const consume = useMutation(api.teamInvites.consume);
  const { signIn } = useAuthActions();

  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // No token at all
  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-ink-soft">
          No invitation link provided. Ask the person who invited you to send the full link.
        </CardContent>
      </Card>
    );
  }

  // Still loading
  if (peek === undefined) {
    return (
      <Card>
        <CardContent className="pt-10 pb-10 text-center">
          <div className="inline-block h-8 w-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
          <p className="mt-3 text-sm text-ink-soft">Checking your invite…</p>
        </CardContent>
      </Card>
    );
  }

  if (peek === null) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-red-50 p-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Invitation not found</p>
              <p className="text-xs mt-1 text-danger/80">
                This invite may have been revoked or the link is malformed. Ask the boss who
                invited you to send a fresh one.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (peek.status === 'expired' || peek.status === 'used') {
    const msg =
      peek.status === 'expired'
        ? 'This invitation expired (links are valid for 72 hours).'
        : 'This invitation has already been used.';
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-red-50 p-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Can&apos;t use this link</p>
              <p className="text-xs mt-1 text-danger/80">
                {msg} Ask the person who invited you to send a fresh link.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Valid invite — show preview + form
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setSubmitting(true);

    try {
      // 1. Convex Auth signUp creates the user with the locked email
      await signIn('password', {
        email: peek.email,
        password,
        flow: 'signUp',
        // @ts-expect-error optional name passthrough (Convex Auth supports custom fields via account)
        name: fullName.trim() || peek.fullName || undefined,
      });

      // 2. Pull the newly-created user id so we can attach the membership.
      //    Convex Auth's signIn flow doesn't return userId, but we can read
      //    it from the freshly-bound session via api.users.me.
      // Small wait — give Convex a moment to commit the new user row.
      const userResult = await pollForUser();
      if (!userResult) throw new Error('Sign up succeeded but session not ready. Refresh and try again.');

      // 3. Consume the invite → creates the membership with the role
      await consume({ token, userId: userResult.userId });

      // 4. Done — go to the dashboard
      router.replace('/admin');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not complete sign up.';
      setError(msg.includes('Email already') ? 'An account for that email already exists. Sign in instead.' : msg);
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        <div className="rounded-md bg-brand-green-soft border border-brand-green/30 p-4">
          <p className="text-2xs uppercase tracking-wider font-medium text-brand-green mb-1">You&apos;ve been invited</p>
          <p className="font-heading text-lg text-ink">{peek.orgName}</p>
          <div className="mt-3 space-y-1.5 text-sm">
            <p className="flex items-center gap-2 text-ink-muted">
              <Mail className="h-4 w-4 text-ink-soft" /> {peek.email}
            </p>
            <p className="flex items-center gap-2 text-ink-muted">
              <Briefcase className="h-4 w-4 text-ink-soft" /> Joining as <span className="font-medium text-ink">{ROLE_LABEL[peek.role] ?? peek.role}</span>
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Your full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={peek.fullName ?? 'Your full name'}
              required={!peek.fullName}
            />
          </div>
          <div>
            <Label htmlFor="password">Choose a password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
            />
            <p className="text-2xs text-ink-soft mt-1.5">
              Pick something only you know. We never see it — it&apos;s stored as a one-way hash.
            </p>
          </div>
          {error && (
            <p className="text-sm text-danger flex items-start gap-2" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Joining…' : 'Join the team'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Small helper — after signUp completes, the user record exists but the
// client-side identity may take a beat to propagate. Poll briefly.
async function pollForUser(): Promise<{ userId: any } | null> {
  // Lazy import so this isn't bundled into pages that don't need it
  const { ConvexReactClient } = await import('convex/react');
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://preview.convex.cloud';
  const client = new ConvexReactClient(url);
  // @ts-expect-error: api type is broad; we just need the function path
  const { api } = await import('@convex/_generated/api');
  for (let i = 0; i < 10; i++) {
    try {
      const me: any = await client.query(api.users.me, {});
      if (me?.userId) return { userId: me.userId };
    } catch { /* try again */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

export default function TeamJoin() {
  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" />
          <h1 className="font-heading text-2xl mt-6">Join your team</h1>
          <p className="text-sm text-ink-soft mt-2">Set your password and you&apos;re in.</p>
        </div>
        <Suspense fallback={<div className="text-sm text-ink-soft text-center">Loading…</div>}>
          <TeamJoinInner />
        </Suspense>
        <p className="text-2xs text-ink-soft text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Single use · 72-hour expiry · invitation locked to your email
        </p>
      </div>
    </main>
  );
}
