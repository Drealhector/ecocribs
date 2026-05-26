'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { PasswordInput } from '@/components/design/PasswordInput';
import { Button } from '@/components/design/Button';

type Role = 'principal' | 'admin' | 'staff';

const ROLE_LABEL: Record<Role, string> = {
  principal: 'Principal',
  admin: 'Admin',
  staff: 'Staff',
};

const ROLE_PATH: Record<Role, string> = {
  principal: '/principal',
  admin: '/admin',
  staff: '/staff',
};

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('principal');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(ROLE_PATH[role]);
  };

  const roles: Role[] = ['principal', 'admin', 'staff'];

  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" />
          <h1 className="font-heading text-2xl mt-6">Sign in</h1>
          <p className="text-sm text-ink-soft mt-2">
            For EcoCribs principals, admins, and staff.{' '}
            <Link href="/customer-sign-in" className="text-brand-green underline">Customer?</Link>
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Role chooser */}
              <div role="tablist" aria-label="Sign in as" className="flex rounded-md border border-border bg-canvas-warm p-1 text-sm">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="tab"
                    aria-selected={role === r}
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-sm py-2 font-medium transition-colors ${
                      role === r ? 'bg-canvas text-ink shadow-soft' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>

              <div>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@ecocribsrealty.com" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                Sign in as {ROLE_LABEL[role]}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-2xs text-ink-soft text-center">
          New here?{' '}
          <Link href="/become-an-agent" className="text-brand-green underline">Register as an agent</Link>
        </p>
      </div>
    </main>
  );
}
