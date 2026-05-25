'use client';

import { use, useState } from 'react';
import { useMutation, useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { Button } from '@/components/design/Button';
import { Input, Label } from '@/components/design/Input';
import { DocumentViewer } from '@/components/document-viewer/DocumentViewer';
import { ProgressTree, type StageKey } from '@/components/progress-tree/ProgressTree';
import { formatNGN, formatDateTime, shortId } from '@/lib/format';
import { stageFromState } from '@convex/lib/formatters';
import { IS_PREVIEW, previewDeal } from '@/lib/preview';
import { Mail, Phone, MapPin, Wallet, Save, Check } from 'lucide-react';

const STAGE_ORDER: StageKey[] = ['payment', 'offer', 'contract', 'survey', 'deed'];

const PREVIEW_AGENTS_FOR_DEAL = [
  { userId: 'agent_001' as any, fullName: 'Tomi Akinola', email: 'tomi@ecocribsrealty.com' },
  { userId: 'agent_002' as any, fullName: 'David Ojo', email: 'david@ecocribsrealty.com' },
  { userId: 'agent_003' as any, fullName: 'Amaka Ude', email: 'amaka@ecocribsrealty.com' },
];

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
        </div>

        <div className="space-y-6">
          {/* Commission setter — admin-only */}
          <CommissionSetter dealId={deal._id} dealValueKobo={deal.purchasePriceKobo} />

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

function CommissionSetter({ dealId, dealValueKobo }: { dealId: any; dealValueKobo: number }) {
  const setForDeal = useMutation(api.commissions.setForDeal);

  const [agentUserId, setAgentUserId] = useState<string>(PREVIEW_AGENTS_FOR_DEAL[0]!.userId);
  const [percentStr, setPercentStr] = useState('2.5');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const percentBps = Math.round(Number(percentStr) * 100);
  const previewKobo = Math.round((dealValueKobo * percentBps) / 10_000);
  const valid = Number.isFinite(percentBps) && percentBps >= 0 && percentBps <= 5000;

  const onSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      if (IS_PREVIEW) {
        await new Promise((r) => setTimeout(r, 400));
        setSavedAt(Date.now());
      } else {
        await setForDeal({
          dealId: dealId as Id<'deals'>,
          agentUserId: agentUserId as Id<'users'>,
          percentBps,
        });
        setSavedAt(Date.now());
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-brand-green/30">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-green-soft text-brand-green shrink-0">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-lg">Commission</h2>
            <p className="text-xs text-ink-soft">Set or update the agent&apos;s payout on this deal.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="commission-agent">Agent</Label>
            <select
              id="commission-agent"
              value={agentUserId}
              onChange={(e) => setAgentUserId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-canvas px-3 text-sm text-ink focus-visible:outline-none focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange/30"
            >
              {PREVIEW_AGENTS_FOR_DEAL.map((a) => (
                <option key={a.userId} value={a.userId}>{a.fullName} · {a.email}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="commission-pct">Commission %</Label>
            <div className="relative">
              <Input
                id="commission-pct"
                type="number"
                step="0.05"
                min="0"
                max="50"
                value={percentStr}
                onChange={(e) => setPercentStr(e.target.value)}
                className="pr-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">%</span>
            </div>
            {valid && (
              <p className="text-xs text-ink-soft mt-1.5">
                Agent earns <span className="font-medium text-brand-green mono tabular">{formatNGN(previewKobo)}</span> when this deal completes.
              </p>
            )}
          </div>

          <Button onClick={onSave} disabled={!valid || saving} className="w-full">
            {savedAt && Date.now() - savedAt < 3000 ? (
              <><Check className="h-4 w-4" /> Saved</>
            ) : (
              <><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Set commission'}</>
            )}
          </Button>
        </div>

        <div className="mt-4 pt-3 border-t border-border-subtle text-2xs text-ink-soft">
          Logged to the commission ledger. Agent is notified when their deal closes.
        </div>
      </CardContent>
    </Card>
  );
}
