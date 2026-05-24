'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { IS_PREVIEW } from '@/lib/preview';
import { checkDemoCredentials } from '@/lib/demo-auth';
import dynamic from 'next/dynamic';
import { ShieldCheck } from 'lucide-react';

const ClerkSignIn = dynamic(
  () => import('@clerk/nextjs').then((m) => m.SignIn),
  { ssr: false, loading: () => null },
);

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
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
              <form onSubmit={onSubmit} className="space-y-4">
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
          <ClerkSignIn routing="path" path="/sign-in" />
        )}
      </div>
    </main>
  );
}
