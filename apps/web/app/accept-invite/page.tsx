'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { IS_PREVIEW, PREVIEW_DEALS } from '@/lib/preview';

function AcceptInviteInner() {
  const params = useSearchParams();
  const tokenFromUrl = params.get('t') ?? '';
  const accept = useMutation(api.invitations.acceptInvite);

  const [token, setToken] = useState(tokenFromUrl);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const autoTried = useRef(false);

  const tryAccept = async (t: string) => {
    setError(null);
    setSubmitting(true);
    try {
      if (IS_PREVIEW) {
        window.location.replace(`/d/${PREVIEW_DEALS[0]!._id}`);
        return;
      }
      const session = await accept({ token: t });
      window.location.replace(`/d/${session.dealId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This link is invalid or has expired.');
      setSubmitting(false);
    }
  };

  // One tap from WhatsApp → portal. Fire immediately, never render a
  // 'welcome' screen for the URL-token case.
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

  // Auto-accepting (token in URL, still in flight) — minimal splash, no chrome
  if (tokenFromUrl && !error) {
    return (
      <main className="min-h-dvh grid place-items-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="h-6 w-6 rounded-full border-2 border-brand-orange border-t-transparent animate-spin mt-4" />
          <p className="text-xs text-ink-soft mono tracking-wider">OPENING YOUR PORTAL…</p>
        </div>
      </main>
    );
  }

  // No-token fallback OR error: ask for the link manually
  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" />
          <h1 className="font-heading text-2xl mt-6">Open your portal</h1>
        </div>
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
                <Label htmlFor="token">Your personal link</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste the link from your WhatsApp"
                  required
                />
                <p className="text-xs text-ink-soft mt-2 flex items-center gap-1.5">
                  <MessageCircle className="h-3 w-3" /> Tip: tap the link directly in WhatsApp — it
                  opens automatically.
                </p>
              </div>
              <Button type="submit" disabled={!token || submitting} className="w-full">
                {submitting ? 'Opening…' : 'Open my portal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function AcceptInvite() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-canvas" />}>
      <AcceptInviteInner />
    </Suspense>
  );
}
