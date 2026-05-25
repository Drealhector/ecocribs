'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { PasswordInput } from '@/components/design/PasswordInput';
import { Button } from '@/components/design/Button';
import { MessageCircle } from 'lucide-react';
import { PREVIEW_DEALS } from '@/lib/preview';

export default function CustomerSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo mode: any input (or no input) opens the customer portal
    router.push(`/d/${PREVIEW_DEALS[0]!._id}`);
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
                  placeholder="your.name@gmail.com"
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
                Open my portal
              </Button>
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
