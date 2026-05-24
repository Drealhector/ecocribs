'use client';

import Link from 'next/link';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { formatNGN } from '@/lib/format';
import { IS_PREVIEW, PREVIEW_DEALS, PREVIEW_PROPERTIES } from '@/lib/preview';
import { TrendingUp, Clock, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/design/Button';

export default function AdminOverview() {
  const liveDeals = useQuery(api.deals.list, IS_PREVIEW ? 'skip' : { limit: 200 });
  const deals = IS_PREVIEW ? PREVIEW_DEALS : liveDeals;

  if (deals === undefined) return <Loading />;

  const counts = {
    total: deals.length,
    awaitingClient: deals.filter((d) => d.statusLabel === 'Awaiting Client').length,
    awaitingEcoCribs: deals.filter((d) => d.statusLabel === 'Awaiting EcoCribs').length,
    completed: deals.filter((d) => d.state === 'COMPLETED').length,
  };
  const totalNgn = deals.reduce((s, d) => s + d.purchasePriceKobo, 0);

  return (
    <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Overview</h1>
          <p className="text-ink-soft mt-1">Active transactions across EcoCribs Realty.</p>
        </div>
        <Button asChild className="self-start sm:self-auto">
          <Link href="/admin/deals/new">
            <Plus className="h-4 w-4" /> Onboard customer
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPI icon={<TrendingUp className="h-5 w-5" />} label="Active deals" value={String(counts.total)} tint="green" />
        <KPI icon={<Clock className="h-5 w-5" />} label="Awaiting client" value={String(counts.awaitingClient)} tint="orange" />
        <KPI icon={<AlertCircle className="h-5 w-5" />} label="Awaiting EcoCribs" value={String(counts.awaitingEcoCribs)} tint="gold" />
        <KPI icon={<CheckCircle2 className="h-5 w-5" />} label="Closed" value={String(counts.completed)} tint="green" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Recent deals</h2>
            <Link href="/admin/deals" className="text-sm text-brand-green hover:underline">View all</Link>
          </div>

          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {deals.slice(0, 10).map((d) => {
              const prop = PREVIEW_PROPERTIES[d.propertyId as unknown as string];
              return (
                <Link
                  key={d._id}
                  href={`/admin/deals/${d._id}`}
                  className="block rounded-md border border-border-subtle p-3 active:bg-canvas-warm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{d.buyerName}</p>
                      <p className="text-xs text-ink-soft truncate">{d.buyerEmail}</p>
                      <p className="text-xs text-ink-muted mt-1 truncate">{prop?.name ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="mono tabular text-sm font-medium">{formatNGN(d.purchasePriceKobo)}</p>
                      <div className="mt-1.5"><StatusPill label={d.statusLabel} /></div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {deals.length === 0 && (
              <p className="py-8 text-center text-ink-soft text-sm">No deals yet.</p>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block -mx-2 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-ink-soft border-b border-border-subtle">
                  <th className="text-left font-medium pb-2 px-2">Buyer</th>
                  <th className="text-left font-medium pb-2 px-2">Property</th>
                  <th className="text-left font-medium pb-2 px-2">Price</th>
                  <th className="text-left font-medium pb-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {deals.slice(0, 10).map((d) => {
                  const prop = PREVIEW_PROPERTIES[d.propertyId as unknown as string];
                  return (
                    <tr key={d._id} className="border-b border-border-subtle last:border-0 hover:bg-canvas-warm">
                      <td className="py-3 px-2">
                        <Link href={`/admin/deals/${d._id}`} className="font-medium text-ink hover:text-brand-orange">
                          {d.buyerName}
                        </Link>
                        <p className="text-xs text-ink-soft">{d.buyerEmail}</p>
                      </td>
                      <td className="py-3 px-2 text-sm text-ink-muted truncate max-w-[220px]">
                        {prop?.name ?? '—'}
                      </td>
                      <td className="py-3 px-2 mono tabular text-sm">{formatNGN(d.purchasePriceKobo)}</td>
                      <td className="py-3 px-2"><StatusPill label={d.statusLabel} /></td>
                    </tr>
                  );
                })}
                {deals.length === 0 && (
                  <tr><td colSpan={4} className="py-10 text-center text-ink-soft text-sm">No deals yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-ink-soft mono">Pipeline value: {formatNGN(totalNgn)}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="container py-8 space-y-4">
      <div className="h-8 w-48 bg-canvas-warm rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-4">
        {[0,1,2,3].map(i => <div key={i} className="h-24 bg-canvas-warm rounded-md animate-pulse" />)}
      </div>
    </div>
  );
}

function KPI({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: 'orange'|'green'|'gold' }) {
  const t = tint === 'orange' ? 'bg-brand-orange-soft text-brand-orange'
        : tint === 'gold' ? 'bg-brand-gold-soft text-brand-gold'
        : 'bg-brand-green-soft text-brand-green';
  return (
    <Card>
      <CardContent className="pt-6 flex items-start gap-4">
        <span className={`grid h-10 w-10 place-items-center rounded-md ${t}`}>{icon}</span>
        <div>
          <p className="text-2xs uppercase tracking-wider text-ink-soft font-medium">{label}</p>
          <p className="font-heading text-3xl text-ink mt-1 tabular">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
