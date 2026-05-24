'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Logo } from '@/components/design/Logo';
import { SignaturePad, type SignaturePayload } from '@/components/signature-pad/SignaturePad';
import { Card, CardContent } from '@/components/design/Card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { IS_PREVIEW, previewDeal } from '@/lib/preview';

const CONSENT = `I confirm that I have read, understood, and agree to the contents of this document. I understand that my electronic signature has the same legal effect as a handwritten signature under the Evidence Act 2011, and that this signature event — including my IP address, device, and the time of signing — will be recorded in an immutable audit trail.`;

export default function SignDocument({ params }: { params: Promise<{ dealId: string; docId: string }> }) {
  const { dealId, docId } = use(params);
  const router = useRouter();
  const live = useQuery(api.deals.get, IS_PREVIEW ? 'skip' : { id: dealId as Id<'deals'> });
  const data = IS_PREVIEW ? previewDeal(dealId) : live;
  const [error, setError] = useState<string | null>(null);

  if (!data) return <div className="container py-12 text-ink-soft">Loading…</div>;
  const document = data.documents.find((d) => d._id === docId) ?? data.documents[0];
  if (!document) return <div className="container py-12 text-ink-soft">Document not found.</div>;

  const onSign = async (_payload: SignaturePayload) => {
    try {
      // TODO(production): call action `api.documents.signature.signByClient`.
      // For preview, route back to the deal.
      router.push(`/d/${dealId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record signature.');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas-warm">
      <header className="border-b border-border bg-canvas">
        <div className="container h-16 flex items-center justify-between">
          <Logo tagline="SIGNING" />
          <Link href={`/d/${dealId}`} className="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Back to deal
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8 max-w-3xl space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-green font-medium">
              {document.kind.replace(/_/g, ' ')}
            </p>
            <h1 className="font-heading text-3xl mt-1">Read carefully, then sign.</h1>
            <p className="text-ink-muted mt-2">
              Your signature is final. The document will be cryptographically sealed the moment you submit.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="aspect-[8.5/11] rounded-md bg-canvas border border-border grid place-items-center text-ink-soft">
                PDF renders here (full document, scrollable)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <SignaturePad
                signerName={data.deal.buyerName}
                consentText={CONSENT}
                consentVersion={1}
                onSign={onSign}
              />
              {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
