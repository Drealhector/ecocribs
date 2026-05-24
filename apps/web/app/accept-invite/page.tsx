'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { ShieldCheck, MessageCircle, AlertCircle } from 'lucide-react';
import { IS_PREVIEW, PREVIEW_DEALS } from '@/lib/preview';

function AcceptInviteInner() {
  const params = useSearchParams();
  const tokenFromUrl = params.get('t') ?? '';
  const accept = useMutation(api.invitations.acceptInvite);

  const [token, setToken] = useState(tokenFromUrl);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const autoTried = useRef(false);

  const goToDeal = (dealId: string) => {
    window.location.href = `/d/${dealId}`;
  };

  const tryAccept = async (t: string) => {
    setError(null);
    setSubmitting(true);
    try {
      if (IS_PREVIEW) {
        goToDeal(PREVIEW_DEALS[0]!._id as unknown as string);
        return;
      }
      const session = await accept({ token: t });
      goToDeal(session.dealId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This link is invalid or has expired.');
      setSubmitting(false);
    }
  };

  // Auto-accept the moment we land with a token in the URL — one tap from
  // WhatsApp and the customer is straight in their portal.
  useEffect(() => {
    if (tokenFromUrl && !autoTried.current) {
      autoTried.current = true;
      tryAccept(tokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    tryAccept(token.trim());
  };

  // Auto-accepting state (token in URL, in-flight)
  if (tokenFromUrl && submitting && !error) {
    return (
      <Card>
        <CardContent className="pt-10 pb-10 text-center">
          <div className="inline-block h-10 w-10 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" />
          <p className="mt-4 text-ink-soft text-sm">Opening your portal…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-md border border-danger/30 bg-red-50 p-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">This link won&apos;t open</p>
              <p className="text-xs mt-1 text-danger/80">
                It may have expired or already been used. Reply to your EcoCribs agent on
                WhatsApp for a fresh link.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="token">Paste your link here</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={IS_PREVIEW ? 'Paste anything — demo accepts all' : 'https://ecocribs-web.vercel.app/accept-invite?t=…'}
              required
            />
            <p className="text-xs text-ink-soft mt-2 flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" /> Tip: just tap the link in your WhatsApp message
              — it opens your portal automatically.
            </p>
          </div>
          <Button type="submit" disabled={!token || submitting} className="w-full">
            {submitting ? 'Opening…' : 'Open my portal'}
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
            One tap from the link your agent sent you and you&apos;re in.
          </p>
        </div>
        <Suspense fallback={<div className="text-sm text-ink-soft text-center">Loading…</div>}>
          <AcceptInviteInner />
        </Suspense>
        <p className="text-2xs text-ink-soft text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Single use · Expires 72 hours after invitation
        </p>
      </div>
    </main>
  );
}
