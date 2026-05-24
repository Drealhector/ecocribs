'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useMutation } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Button } from '@/components/design/Button';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { IS_PREVIEW, PREVIEW_DEALS } from '@/lib/preview';

export default function WitnessGate({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const accept = useMutation(api.invitations.acceptInvite);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(true);
  const autoTried = useRef(false);

  const tryAccept = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (IS_PREVIEW) {
        const target = PREVIEW_DEALS[0]!._id as unknown as string;
        window.location.href = `/d/${target}/sign/${target}_contract`;
        return;
      }
      const session = await accept({ token });
      window.location.href = `/d/${session.dealId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This link is invalid or has expired.');
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!autoTried.current) {
      autoTried.current = true;
      tryAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-dvh grid place-items-center bg-canvas-warm pattern-vine px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo className="justify-center inline-flex" tagline="WITNESS" />
          <h1 className="font-heading text-2xl mt-6">Opening witness signing…</h1>
        </div>

        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            {submitting && !error && (
              <>
                <div className="inline-block h-10 w-10 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" />
                <p className="mt-4 text-ink-soft text-sm">Verifying your invitation…</p>
              </>
            )}
            {error && (
              <div className="text-left">
                <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-red-50 p-3 text-sm text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">This witness link won&apos;t open</p>
                    <p className="text-xs mt-1 text-danger/80">
                      It may have expired or already been used. Ask the person who invited you to
                      send a fresh link.
                    </p>
                  </div>
                </div>
                <Button onClick={tryAccept} variant="outline" className="mt-4 w-full">
                  Try again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-2xs text-ink-soft text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Single use · Expires 7 days after invitation
        </p>
      </div>
    </main>
  );
}
