'use client';

import { use } from 'react';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { Button } from '@/components/design/Button';
import { DocumentViewer } from '@/components/document-viewer/DocumentViewer';
import { ProgressTree, type StageKey } from '@/components/progress-tree/ProgressTree';
import { formatNGN, formatDateTime, shortId } from '@/lib/format';
import { stageFromState } from '@convex/lib/formatters';
import { IS_PREVIEW, previewDeal } from '@/lib/preview';
import { Mail, Phone, MapPin, AlertTriangle } from 'lucide-react';

const STAGE_ORDER: StageKey[] = ['payment', 'offer', 'contract', 'survey', 'deed'];

export default function DealDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const live = useQuery(api.deals.get, IS_PREVIEW ? 'skip' : { id: id as Id<'deals'> });
  const data = IS_PREVIEW ? previewDeal(id) : live;

  if (!data) return <div className="container py-8 text-ink-soft">Loading…</div>;
  const { deal, property, documents, statusLabel } = data;

  const currentStage = (stageFromState(deal.state) ?? 'payment') as StageKey;
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const completedStages = STAGE_ORDER.slice(0, currentIdx) as StageKey[];
  if (deal.state === 'COMPLETED') completedStages.push('deed');

  return (
    <div className="container py-8 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-soft mono">DEAL #{shortId(String(deal._id))}</p>
          <h1 className="font-heading text-3xl mt-1">{deal.buyerName}</h1>
          <p className="text-ink-soft text-sm mt-1 flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {deal.buyerEmail}</span>
            <span className="inline-flex items-center gap-1.5 mono tabular"><Phone className="h-3.5 w-3.5" /> {deal.buyerPhone}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill label={statusLabel} />
          <p className="text-xs text-ink-soft tabular">Updated {formatDateTime(deal.updatedAt)}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-heading text-xl mb-4">Property</h2>
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-md bg-canvas-warm grid place-items-center text-ink-soft shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{property?.name ?? 'Unknown'}</p>
                  <p className="text-sm text-ink-soft mt-0.5">
                    {property?.estate}{property?.estate ? ', ' : ''}{property?.lga}, {property?.state}
                  </p>
                  <div className="mt-3 flex gap-6 text-sm text-ink-muted">
                    <span><span className="text-ink-soft">Size:</span> <span className="mono tabular">{property?.sizeSqm} sqm</span></span>
                    <span><span className="text-ink-soft">Title:</span> <span className="mono uppercase">{property?.titleType?.replace(/_/g, ' ')}</span></span>
                  </div>
                </div>
                <p className="font-heading text-xl text-ink mono tabular">{formatNGN(deal.purchasePriceKobo)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl">Documents</h2>
                <Button variant="outline" size="sm">Send for signature</Button>
              </div>
              <div className="space-y-3">
                {documents.map((d: any) => (<DocumentViewer key={d._id} doc={d as any} />))}
                {documents.length === 0 && (
                  <p className="text-sm text-ink-soft text-center py-8">
                    No documents yet. They&apos;ll appear as each stage completes.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {deal.requiresWetInkDeed && (
            <div className="rounded-md border border-brand-gold/30 bg-brand-gold-soft p-4 flex items-start gap-3 text-sm">
              <AlertTriangle className="h-5 w-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-ink">Wet-ink Deed required</p>
                <p className="text-ink-muted mt-1">
                  When this deal reaches the Deed of Assignment stage, the portal will pause for the
                  printed deed to be wet-signed, stamped, and lodged for Governor&apos;s consent.
                  Upload the wet-signed scan to advance to <em>Awaiting Governor&apos;s Consent</em>.
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-heading text-xl mb-4">Progress</h2>
              <ProgressTree currentStage={currentStage} completedStages={completedStages} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
