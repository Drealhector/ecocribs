'use client';

import { use } from 'react';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Logo } from '@/components/design/Logo';
import { Card, CardContent } from '@/components/design/Card';
import { Button } from '@/components/design/Button';
import { ProgressTree, type StageKey } from '@/components/progress-tree/ProgressTree';
import { DocumentViewer } from '@/components/document-viewer/DocumentViewer';
import { formatNGN, formatDateShort, shortId } from '@/lib/format';
import { stageFromState } from '@convex/lib/formatters';
import { IS_PREVIEW, previewDeal } from '@/lib/preview';
import { Footer } from '@/components/design/Footer';
import { MessageCircle, Mail } from 'lucide-react';

const STAGE_ORDER: StageKey[] = ['payment', 'offer', 'contract', 'survey', 'deed'];

export default function ClientDealView({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = use(params);
  const live = useQuery(api.deals.get, IS_PREVIEW ? 'skip' : { id: dealId as Id<'deals'> });
  const data = IS_PREVIEW ? previewDeal(dealId) : live;

  if (!data) return <div className="container py-12 text-ink-soft">Loading your deal…</div>;
  const { deal, property, documents, statusLabel } = data;

  const currentStage = (stageFromState(deal.state) ?? 'payment') as StageKey;
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const completedStages = STAGE_ORDER.slice(0, currentIdx) as StageKey[];

  const nextDoc = documents.find((d) => d.status === 'sent' || d.status === 'partially_signed');

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border bg-canvas">
        <div className="container h-16 flex items-center justify-between">
          <Logo tagline="MY PROPERTY" />
          <p className="text-xs text-ink-soft mono uppercase tabular">#{shortId(String(deal._id))}</p>
        </div>
      </header>

      <main className="flex-1 bg-canvas-warm pattern-vine">
        <div className="container py-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-md bg-brand-green-soft shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wider text-brand-green font-medium">Your home</p>
                    <h1 className="font-heading text-2xl mt-1">{property?.name}</h1>
                    <p className="text-sm text-ink-muted mt-1">
                      {property?.estate ? property.estate + ', ' : ''}{property?.lga}, {property?.state}
                      {property ? ' · ' : ''}
                      {property ? <span className="mono tabular">{property.sizeSqm} sqm</span> : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-ink-soft">Purchase price</p>
                    <p className="font-heading text-xl mono tabular mt-1">{formatNGN(deal.purchasePriceKobo)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-brand-orange-soft border-brand-orange/30">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-brand-orange font-medium">What&apos;s next</p>
                {nextDoc ? (
                  <>
                    <h2 className="font-heading text-2xl mt-1">Sign your {nextDoc.kind.replace(/_/g, ' ')}</h2>
                    <p className="text-ink-muted mt-2">
                      Take 3 minutes to review and sign. Your signature is captured with a full audit
                      trail and a SHA-256 hash of the signed document.
                    </p>
                    <Button asChild className="mt-4" size="lg">
                      <a href={`/d/${deal._id}/sign/${nextDoc._id}`}>Open document</a>
                    </Button>
                  </>
                ) : (
                  <>
                    <h2 className="font-heading text-2xl mt-1">{statusLabel}</h2>
                    <p className="text-ink-muted mt-2">
                      No action required from you right now. EcoCribs will message you here, by email,
                      and on WhatsApp the moment the next document is ready.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading text-xl mb-4">Your documents</h3>
                <div className="space-y-3">
                  {documents.map((d: any) => <DocumentViewer key={d._id} doc={d as any} />)}
                  {documents.length === 0 && (
                    <p className="text-sm text-ink-soft text-center py-8">
                      Documents will appear here as each stage completes.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading text-xl mb-4">Your progress</h3>
                <ProgressTree currentStage={currentStage} completedStages={completedStages} />
                <p className="mt-6 text-xs text-ink-soft tabular border-t border-border-subtle pt-3">
                  Started {formatDateShort(deal.createdAt)} · Last updated {formatDateShort(deal.updatedAt)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading text-lg">Need a hand?</h3>
                <p className="text-sm text-ink-muted mt-2">Reach EcoCribs documentation directly.</p>
                <div className="mt-4 space-y-2 text-sm">
                  <a href="https://wa.me/2348157144444" className="flex items-center gap-2 text-brand-green hover:underline">
                    <MessageCircle className="h-4 w-4" /> WhatsApp <span className="mono tabular">+234 815 714 4444</span>
                  </a>
                  <a href="mailto:help@ecocribsrealty.com" className="flex items-center gap-2 text-brand-green hover:underline">
                    <Mail className="h-4 w-4" /> help@ecocribsrealty.com
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
