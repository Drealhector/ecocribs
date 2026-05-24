'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { ShieldCheck, MessageCircle } from 'lucide-react';
import { IS_PREVIEW, PREVIEW_DEALS } from '@/lib/preview';

function AcceptInviteForm() {
  const params = useSearchParams();
  const tokenFromUrl = params.get('t') ?? '';
  const accept = useMutation(api.invitations.acceptInvite);
  const [token, setToken] = useState(tokenFromUrl);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (IS_PREVIEW) {
        // Demo: any PIN routes to Adaeze's deal. Production wires Convex.
        const target = PREVIEW_DEALS[0]!._id;
        window.location.href = `/d/${target}`;
        return;
      }
      const session = await accept({ token, pin });
      window.location.href = `/d/${session.dealId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {!tokenFromUrl && (
            <div>
              <Label htmlFor="token">Invitation link</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={IS_PREVIEW ? "Paste anything — demo accepts all" : "Paste the full link from your email"}
                required={!IS_PREVIEW}
              />
            </div>
          )}
          <div>
            <Label htmlFor="pin">6-digit code from WhatsApp</Label>
            <Input
              id="pin"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
            <p className="text-xs text-ink-soft mt-2 flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" /> Sent to your phone separately from the link
            </p>
            {IS_PREVIEW && (
              <p className="text-2xs text-brand-gold mt-2">Demo: type any 6 digits to continue</p>
            )}
          </div>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <Button
            type="submit"
            disabled={(!IS_PREVIEW && !token) || pin.length !== 6 || submitting}
            className="w-full"
          >
            {submitting ? 'Verifying…' : 'Open my deal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AcceptInvite() {
  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" />
          <h1 className="font-heading text-2xl mt-6">Welcome to your home journey</h1>
          <p className="text-sm text-ink-soft mt-2">
            Two-factor by design: link from email, code from WhatsApp.
          </p>
        </div>
        <Suspense fallback={<div className="text-sm text-ink-soft text-center">Loading…</div>}>
          <AcceptInviteForm />
        </Suspense>
        <p className="text-2xs text-ink-soft text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Single-use · Expires 72 hours after invitation
        </p>
      </div>
    </main>
  );
}
