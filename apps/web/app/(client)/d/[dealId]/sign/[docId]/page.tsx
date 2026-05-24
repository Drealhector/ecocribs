'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Logo } from '@/components/design/Logo';
import { SignaturePad, type SignaturePayload } from '@/components/signature-pad/SignaturePad';
import { DocumentFields, defaultFieldsForKind, type DocFieldValues } from '@/components/document-viewer/DocumentFields';
import { Card, CardContent } from '@/components/design/Card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { IS_PREVIEW, previewDeal } from '@/lib/preview';

const CONSENT = `I confirm I have read and agree to sign this document. I understand my signature, the time, and my device are recorded.`;

export default function SignDocument({ params }: { params: Promise<{ dealId: string; docId: string }> }) {
  const { dealId, docId } = use(params);
  const router = useRouter();
  const live = useQuery(api.deals.get, IS_PREVIEW ? 'skip' : { id: dealId as Id<'deals'> });
  const data = IS_PREVIEW ? previewDeal(dealId) : live;
  const [fieldValues, setFieldValues] = useState<DocFieldValues>({});
  const [error, setError] = useState<string | null>(null);

  const doc = useMemo(() => data?.documents.find((d: any) => d._id === docId) ?? data?.documents[0], [data, docId]);
  const fields = useMemo(
    () => (doc ? defaultFieldsForKind(doc.kind as any, data?.deal?.buyerName ?? '') : []),
    [doc, data],
  );

  if (!data) return <div className="container py-12 text-ink-soft">Loading…</div>;
  if (!doc) return <div className="container py-12 text-ink-soft">Document not found.</div>;

  const requiredFields = fields.filter((f) => f.required);
  const allRequiredFilled = requiredFields.every((f) => (fieldValues[f.key] ?? '').trim().length > 0);

  const onSign = async (_payload: SignaturePayload) => {
    if (!allRequiredFilled) {
      setError('Please fill in all the required fields above before signing.');
      return;
    }
    try {
      // TODO(production): call action api.documents.signature.signByClient
      // — bundle fieldValues alongside signature for PDF stamping.
      router.push(`/d/${dealId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record signature.');
    }
  };

  const docTitle = (doc.kind as string).replace(/_/g, ' ');

  return (
    <div className="min-h-dvh flex flex-col bg-canvas-warm">
      <header className="border-b border-border bg-canvas">
        <div className="container h-16 flex items-center justify-between">
          <Logo compact />
          <Link href={`/d/${dealId}`} className="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-6 sm:py-8 max-w-3xl space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-brand-green font-medium">
              {docTitle}
            </p>
            <h1 className="font-heading text-2xl sm:text-3xl mt-1">Fill in &amp; sign.</h1>
          </div>

          {/* PDF preview */}
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-[8.5/11] rounded-md bg-canvas border border-border grid place-items-center text-ink-soft text-sm text-center px-4">
                Full document opens here
                <br />
                <span className="text-2xs">(PDF preview)</span>
              </div>
            </CardContent>
          </Card>

          {/* Fill-in fields */}
          {fields.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <DocumentFields fields={fields} values={fieldValues} onChange={setFieldValues} />
              </CardContent>
            </Card>
          )}

          {/* Signature */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wider font-medium text-ink-soft mb-4">Your signature</p>
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
