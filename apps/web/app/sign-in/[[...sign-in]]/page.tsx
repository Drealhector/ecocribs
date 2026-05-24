'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthActions } from '@/lib/auth-hooks';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { IS_PREVIEW } from '@/lib/preview';
import { checkDemoCredentials } from '@/lib/demo-auth';
import { ShieldCheck } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();

  // Preview-mode state (username/password demo)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Production-mode state (real email/password)
  const [email, setEmail] = useState('');
  const [prodPassword, setProdPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onPreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    if (checkDemoCredentials(username, password)) {
      router.push('/admin');
    } else {
      setError('Invalid credentials. Try hector / testing 123');
      setSubmitting(false);
    }
  };

  const onProdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn('password', { email, password: prodPassword, flow: mode });
      router.push('/admin');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === 'signIn'
            ? 'Invalid email or password.'
            : 'Could not create account.',
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" />
          <h1 className="font-heading text-2xl mt-6">Staff sign-in</h1>
          <p className="text-sm text-ink-soft mt-2">
            EcoCribs admins, managers, agents and documentation officers only.
            <br />
            Clients should use{' '}
            <Link href="/customer-sign-in" className="text-brand-green underline">
              the customer sign-in
            </Link>
            .
          </p>
        </div>

        {IS_PREVIEW ? (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={onPreviewSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="hector"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="testing 123"
                    required
                  />
                </div>
                {error && <p className="text-sm text-danger" role="alert">{error}</p>}
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
                <div className="pt-2 border-t border-border-subtle text-2xs text-ink-soft text-center space-y-1">
                  <p className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3 w-3" /> Demo credentials
                  </p>
                  <p className="mono">
                    hector · testing 123
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={onProdSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@ecocribs.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prod-password">Password</Label>
                  <Input
                    id="prod-password"
                    type="password"
                    autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                    value={prodPassword}
                    onChange={(e) => setProdPassword(e.target.value)}
                    required
                    minLength={mode === 'signUp' ? 8 : undefined}
                  />
                </div>
                {error && <p className="text-sm text-danger" role="alert">{error}</p>}
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting
                    ? mode === 'signIn' ? 'Signing in…' : 'Creating account…'
                    : mode === 'signIn' ? 'Sign in' : 'Create account'}
                </Button>
                <div className="pt-2 border-t border-border-subtle text-2xs text-ink-soft text-center">
                  {mode === 'signIn' ? (
                    <p>
                      Need an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('signUp'); setError(null); }}
                        className="text-brand-green underline"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setMode('signIn'); setError(null); }}
                        className="text-brand-green underline"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
