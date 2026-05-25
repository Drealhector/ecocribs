'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@/lib/convex-hooks';
import { useAuthActions } from '@/lib/auth-hooks';
import { api } from '@convex/_generated/api';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { PasswordInput } from '@/components/design/PasswordInput';
import { Button } from '@/components/design/Button';
import { Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { IS_PREVIEW } from '@/lib/preview';

export default function BecomeAnAgent() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const completeSignup = useMutation(api.agents.completePublicSignup);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError('Full name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setSubmitting(true);
    try {
      if (IS_PREVIEW) {
        // demo shortcut — preview routes straight to /agent
        router.push('/agent');
        return;
      }
      // 1) create auth user via Convex Auth Password provider
      await signIn('password', { email, password, flow: 'signUp' });
      // 2) wait briefly for session to commit, then look up our userId
      const userId = await pollForUser();
      if (!userId) throw new Error('Account created but session not ready. Refresh and sign in.');
      // 3) attach agent membership with auto-staff assignment
      await completeSignup({ userId, fullName: fullName.trim() });
      router.replace('/agent');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not register.';
      setError(
        msg.includes('Email already')
          ? 'An account for that email already exists. Sign in instead.'
          : msg,
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" tagline="AGENT REGISTRATION" />
          <h1 className="font-heading text-2xl mt-6">Become an EcoCribs agent</h1>
          <p className="text-sm text-ink-soft mt-2">
            Refer customers, earn commission when their deal closes. No application — sign up
            and start.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="agent-name">Full name</Label>
                <Input id="agent-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Adaeze Nwosu" required />
              </div>
              <div>
                <Label htmlFor="agent-email">Email</Label>
                <Input id="agent-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.name@gmail.com" required />
              </div>
              <div>
                <Label htmlFor="agent-password">Password</Label>
                <PasswordInput id="agent-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Minimum 8 characters" />
              </div>
              {error && (
                <p className="text-sm text-danger flex items-start gap-2" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
                </p>
              )}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Registering…' : 'Register and start referring'}
              </Button>

              <div className="pt-3 border-t border-border-subtle text-2xs text-ink-soft space-y-1.5">
                <p className="flex items-center justify-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-brand-green" />
                  You&apos;ll be auto-assigned to a Staff member who handles your customers&apos; paperwork
                </p>
                <p className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" />
                  Commission rates are set per deal by EcoCribs leadership
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-2xs text-ink-soft text-center">
          Already an agent?{' '}
          <Link href="/sign-in" className="text-brand-green underline">Sign in here</Link>
        </p>
      </div>
    </main>
  );
}

async function pollForUser(): Promise<string | null> {
  const { ConvexReactClient } = await import('convex/react');
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://preview.convex.cloud';
  const client = new ConvexReactClient(url);
  // @ts-expect-error: api type is broad
  const { api } = await import('@convex/_generated/api');
  for (let i = 0; i < 10; i++) {
    try {
      const me: any = await client.query(api.users.me, {});
      if (me?.userId) return me.userId;
    } catch { /* try again */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}
