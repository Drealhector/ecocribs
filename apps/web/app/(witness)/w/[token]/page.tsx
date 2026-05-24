'use client';

import { use, useState } from 'react';
import { useMutation } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { ShieldCheck } from 'lucide-react';
import { IS_PREVIEW, PREVIEW_DEALS } from '@/lib/preview';

export default function WitnessGate({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const accept = useMutation(api.invitations.acceptInvite);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (IS_PREVIEW) {
        const target = PREVIEW_DEALS[0]!._id;
        window.location.href = `/d/${target}/sign/${target}_contract`;
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
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" tagline="WITNESS" />
          <h1 className="font-heading text-2xl mt-6">Verify to continue</h1>
          <p className="text-sm text-ink-soft mt-2">
            You&apos;ve been asked to witness a property document. Enter the 6-digit code we sent
            you on WhatsApp.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pin">Verification code</Label>
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
                {IS_PREVIEW && (
                  <p className="text-2xs text-brand-gold mt-2">Demo: type any 6 digits to continue</p>
                )}
              </div>
              {error && <p className="text-sm text-danger" role="alert">{error}</p>}
              <Button type="submit" disabled={pin.length !== 6 || submitting} className="w-full">
                {submitting ? 'Verifying…' : 'Continue'}
              </Button>
              <p className="text-2xs text-ink-soft text-center flex items-center justify-center gap-1.5 pt-2">
                <ShieldCheck className="h-3 w-3" />
                Single use · Expires 7 days after invitation
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
