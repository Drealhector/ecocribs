'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { ShieldCheck, MessageCircle } from 'lucide-react';
import { checkDemoCredentials } from '@/lib/demo-auth';
import { PREVIEW_DEALS } from '@/lib/preview';

export default function CustomerSignIn() {
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
      router.push(`/d/${PREVIEW_DEALS[0]!._id}`);
    } else {
      setError('Invalid credentials. Try hector / testing 123');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" tagline="CUSTOMER PORTAL" />
          <h1 className="font-heading text-2xl mt-6">Welcome back</h1>
          <p className="text-sm text-ink-soft mt-2">
            Sign in to track your property documents and signatures.
          </p>
        </div>

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
                {submitting ? 'Signing in…' : 'Open my portal'}
              </Button>
              <div className="pt-3 border-t border-border-subtle space-y-2">
                <p className="text-2xs text-ink-soft text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> Demo credentials
                </p>
                <p className="text-2xs mono text-center text-ink-muted">
                  hector · testing 123
                </p>
                <p className="text-2xs text-ink-soft text-center pt-2 flex items-center justify-center gap-1.5">
                  <MessageCircle className="h-3 w-3" />
                  First time? Use the{' '}
                  <Link href="/accept-invite" className="text-brand-green underline">
                    magic link from WhatsApp
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-2xs text-ink-soft text-center">
          Staff?{' '}
          <Link href="/sign-in" className="text-brand-green underline">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
