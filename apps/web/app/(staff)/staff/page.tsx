'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { Button } from '@/components/design/Button';
import { formatNGN, relativeTime } from '@/lib/format';
import { PREVIEW_DEALS, PREVIEW_PROPERTIES, PREVIEW_COMMISSIONS } from '@/lib/preview';
import { Plus, Users, Receipt, Wallet, AlertCircle, ArrowRight } from 'lucide-react';

const MY_AGENTS = [
  { id: 'ag1', name: 'Tomi Akinola', email: 'tomi@ecocribsrealty.com', activeDeals: 2 },
  { id: 'ag2', name: 'David Ojo', email: 'david@ecocribsrealty.com', activeDeals: 1 },
  { id: 'ag3', name: 'Amaka Ude', email: 'amaka@ecocribsrealty.com', activeDeals: 0 },
];

export default function StaffOverview() {
  const myDeals = PREVIEW_DEALS;
  const awaitingPayment = myDeals.filter((d) => d.state === 'AWAITING_PAYMENT_CONFIRMATION');
  const awaitingAction = myDeals.filter((d) =>
    d.statusLabel === 'Awaiting Client' || d.statusLabel === 'Awaiting Witness',
  );
  const pendingCommissions = PREVIEW_COMMISSIONS.filter((c) => c.status === 'pending').reduce((s, c) => s + c.commissionKobo, 0);

  return (
    <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-2xs uppercase tracking-wider text-brand-green font-medium">Staff</p>
          <h1 className="font-heading text-3xl mt-1">Today</h1>
          <p className="text-ink-soft mt-1">Your assigned agents&apos; pipelines + receipts to issue.</p>
        </div>
        <Button asChild className="self-start sm:self-auto">
          <Link href="/admin/deals/new">
            <Plus className="h-4 w-4" /> Onboard customer
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPI icon={<Receipt className="h-5 w-5" />} label="Awaiting receipt" value={String(awaitingPayment.length)} tint="orange" urgent={awaitingPayment.length > 0} />
        <KPI icon={<AlertCircle className="h-5 w-5" />} label="Customers waiting" value={String(awaitingAction.length)} tint="gold" />
        <KPI icon={<Users className="h-5 w-5" />} label="My agents" value={String(MY_AGENTS.length)} tint="green" />
        <KPI icon={<Wallet className="h-5 w-5" />} label="Pending payouts" value={formatNGN(pendingCommissions)} tint="green" small />
      </div>

      {/* Receipts to issue — top priority */}
      {awaitingPayment.length > 0 && (
        <Card className="border-brand-orange/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-xl flex items-center gap-2">
                <Receipt className="h-5 w-5 text-brand-orange" /> Receipts to issue
              </h2>
            </div>
            <p className="text-sm text-ink-soft mb-4">
              These customers have paid; issue their receipt to start the document flow.
            </p>
            <div className="space-y-2">
              {awaitingPayment.map((d) => {
                const prop = PREVIEW_PROPERTIES[d.propertyId as unknown as string];
                return (
                  <Link
                    key={d._id}
                    href={`/admin/deals/${d._id}`}
                    className="flex items-center justify-between rounded-md border border-border-subtle p-3 hover:bg-canvas-warm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{d.buyerName}</p>
                      <p className="text-xs text-ink-soft truncate">{prop?.name ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="mono tabular text-sm">{formatNGN(d.purchasePriceKobo)}</p>
                      <ArrowRight className="h-4 w-4 text-ink-soft" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My agents */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">My agents</h2>
            <Link href="/staff/agents" className="text-sm text-brand-green hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {MY_AGENTS.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-border-subtle p-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-soft text-brand-green shrink-0">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{a.name}</p>
                    <p className="text-xs text-ink-soft truncate">{a.email}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-ink-muted bg-canvas-warm px-2 py-1 rounded-pill">
                  {a.activeDeals} active
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All my deals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">My agents&apos; customers</h2>
          </div>
          <div className="space-y-3">
            {myDeals.map((d) => {
              const prop = PREVIEW_PROPERTIES[d.propertyId as unknown as string];
              return (
                <Link
                  key={d._id}
                  href={`/admin/deals/${d._id}`}
                  className="block rounded-md border border-border-subtle p-3 hover:bg-canvas-warm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">{d.buyerName}</p>
                      <p className="text-xs text-ink-soft truncate">{prop?.name ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="mono tabular text-sm">{formatNGN(d.purchasePriceKobo)}</p>
                      <div className="mt-1.5"><StatusPill label={d.statusLabel} /></div>
                    </div>
                  </div>
                  <p className="mt-2 text-2xs text-ink-soft">{relativeTime(d.updatedAt)}</p>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon, label, value, tint, small, urgent }: { icon: React.ReactNode; label: string; value: string; tint: 'orange'|'green'|'gold'; small?: boolean; urgent?: boolean }) {
  const t = tint === 'orange' ? 'bg-brand-orange-soft text-brand-orange'
        : tint === 'gold' ? 'bg-brand-gold-soft text-brand-gold'
        : 'bg-brand-green-soft text-brand-green';
  return (
    <Card className={urgent ? 'border-brand-orange/40' : ''}>
      <CardContent className="pt-6 flex items-start gap-4">
        <span className={`grid h-10 w-10 place-items-center rounded-md ${t} shrink-0`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-2xs uppercase tracking-wider text-ink-soft font-medium">{label}</p>
          <p className={`font-heading text-ink mt-1 tabular truncate ${small ? 'mono text-xl' : 'text-3xl'}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
