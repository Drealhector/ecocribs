'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthActions } from '@/lib/auth-hooks';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { PasswordInput } from '@/components/design/PasswordInput';
import { Button } from '@/components/design/Button';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { checkDemoCredentials } from '@/lib/demo-auth';
import { IS_PREVIEW, PREVIEW_DEALS } from '@/lib/preview';

export default function CustomerSignIn() {
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // In preview/demo mode, check the demo creds first — instant entry
    // into the customer portal with seed data. Falls through to real
    // Convex Auth signIn for any other credentials.
    if (IS_PREVIEW && checkDemoCredentials(email, password)) {
      router.push(`/d/${PREVIEW_DEALS[0]!._id}`);
      return;
    }

    try {
      await signIn('password', { email, password, flow: 'signIn' });
      router.push(`/d/${PREVIEW_DEALS[0]!._id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Sign-in failed: ${err.message.replace(/^.*?Error:\s*/, '')}`
          : 'Invalid email or password.',
      );
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
                <Label htmlFor="email">Your email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@gmail.com"
                  required
                />
                <p className="text-2xs text-ink-soft mt-1.5">
                  Use your personal email — Gmail, Yahoo, Outlook, whatever you check.
                </p>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-danger flex items-start gap-2" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
                </p>
              )}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Signing in…' : 'Open my portal'}
              </Button>

              {IS_PREVIEW && (
                <div className="pt-3 border-t border-border-subtle text-2xs text-ink-soft text-center mono">
                  Demo · customer@gmail.com · 1234
                </div>
              )}

              <p className="text-2xs text-ink-soft text-center pt-2 flex items-center justify-center gap-1.5">
                <MessageCircle className="h-3 w-3" />
                First time? Use the{' '}
                <Link href="/accept-invite" className="text-brand-green underline">
                  magic link from WhatsApp
                </Link>
              </p>
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
