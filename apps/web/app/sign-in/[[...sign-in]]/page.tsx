'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { PasswordInput } from '@/components/design/PasswordInput';
import { Button } from '@/components/design/Button';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" />
          <h1 className="font-heading text-2xl mt-6">Staff sign in</h1>
          <p className="text-sm text-ink-soft mt-2">
            EcoCribs admins, managers, agents and documentation officers only.
            <br />
            Clients should use{' '}
            <Link href="/customer-sign-in" className="text-brand-green underline">
              the customer sign in
            </Link>
            .
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={goAdmin} className="space-y-4">
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@ecocribsrealty.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-2xs text-ink-soft text-center">
          New here?{' '}
          <Link href="/become-an-agent" className="text-brand-green underline">
            Register as an agent
          </Link>
        </p>
      </div>
    </main>
  );
}
