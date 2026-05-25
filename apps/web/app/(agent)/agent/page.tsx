'use client';

import Link from 'next/link';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Nav } from '@/components/design/Nav';
import { Footer } from '@/components/design/Footer';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { Button } from '@/components/design/Button';
import { formatNGN, formatDateShort, relativeTime, shortId } from '@/lib/format';
import { IS_PREVIEW, PREVIEW_DEALS, PREVIEW_COMMISSIONS, PREVIEW_PROPERTIES } from '@/lib/preview';
import { Users, Wallet, Plus, Sparkles, ExternalLink, TrendingUp } from 'lucide-react';

export default function AgentDashboard() {
  const liveCustomers = useQuery(api.agents.listMyCustomers, IS_PREVIEW ? 'skip' : {});
  const liveCommissions = useQuery(api.commissions.listForAgent, IS_PREVIEW ? 'skip' : {});
  const customers = IS_PREVIEW ? PREVIEW_DEALS : (liveCustomers ?? []);
  const commissions = IS_PREVIEW ? PREVIEW_COMMISSIONS : (liveCommissions ?? []);

  const pending = commissions.filter((c: any) => c.status === 'pending').reduce((s: number, c: any) => s + c.commissionKobo, 0);
  const cleared = commissions.filter((c: any) => c.status === 'cleared').reduce((s: number, c: any) => s + c.commissionKobo, 0);
  const total = pending + cleared;

  return (
    <>
      <Nav />
      <main className="container py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-2xs uppercase tracking-wider text-brand-green font-medium">Agent</p>
            <h1 className="font-heading text-3xl mt-1">Your pipeline</h1>
            <p className="text-ink-soft mt-1">Customers you brought in and what they&apos;ll earn you.</p>
          </div>
          <Button className="self-start sm:self-auto">
            <Plus className="h-4 w-4" /> Refer a customer
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <KPI icon={<Users className="h-5 w-5" />} label="Your customers" value={String(customers.length)} tint="green" />
          <KPI icon={<Wallet className="h-5 w-5" />} label="Pending commission" value={formatNGN(pending)} tint="orange" small />
          <KPI icon={<TrendingUp className="h-5 w-5" />} label="Lifetime earned" value={formatNGN(total)} tint="green" small />
        </div>

        {/* Customers list */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl">Your customers</h2>
              <span className="text-2xs text-ink-soft">Updated live</span>
            </div>
            {customers.length === 0 ? (
              <p className="py-12 text-center text-ink-soft text-sm">
                No customers yet. Tap <strong>Refer a customer</strong> above to bring your first.
              </p>
            ) : (
              <div className="space-y-3">
                {customers.map((d: any) => {
                  const prop = PREVIEW_PROPERTIES[d.propertyId as unknown as string];
                  return (
                    <div key={d._id} className="block rounded-md border border-border-subtle p-3 hover:bg-canvas-warm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink truncate">{d.buyerName}</p>
                          <p className="text-xs text-ink-soft truncate">{prop?.name ?? '—'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="mono tabular text-sm font-medium">{formatNGN(d.purchasePriceKobo)}</p>
                          <div className="mt-1.5"><StatusPill label={d.statusLabel} /></div>
                        </div>
                      </div>
                      <p className="mt-2 text-2xs text-ink-soft">{relativeTime(d.updatedAt)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commissions ledger */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl">Your commission</h2>
              <span className="inline-flex items-center gap-1.5 text-2xs text-ink-soft">
                <Sparkles className="h-3 w-3 text-brand-green" /> Auto-credits when deal completes
              </span>
            </div>

            {commissions.length === 0 ? (
              <p className="py-10 text-center text-ink-soft text-sm">
                No commissions yet. They appear here once EcoCribs sets a rate on your customers&apos; deals.
              </p>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="space-y-3 md:hidden">
                  {commissions.map((c: any) => (
                    <div key={c._id} className="rounded-md border border-border-subtle p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink truncate">{c.dealBuyer ?? '—'}</p>
                          <p className="text-2xs text-ink-soft mono">{(c.percentBps / 100).toFixed(2)}% of {formatNGN(c.dealValueKobo ?? 0)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="mono tabular text-base font-semibold text-brand-green">{formatNGN(c.commissionKobo)}</p>
                          <div className="mt-1.5">
                            <StatusPill label={c.status === 'cleared' ? 'Paid' : c.status === 'pending' ? 'Pending' : 'Cancelled'} />
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-2xs text-ink-soft">Set {formatDateShort(c.setAt)}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block -mx-2 overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-ink-soft border-b border-border-subtle">
                        <th className="text-left font-medium pb-2 px-2">Customer</th>
                        <th className="text-left font-medium pb-2 px-2">Deal value</th>
                        <th className="text-left font-medium pb-2 px-2">Rate</th>
                        <th className="text-left font-medium pb-2 px-2">You earn</th>
                        <th className="text-left font-medium pb-2 px-2">Status</th>
                        <th className="text-left font-medium pb-2 px-2">Set on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((c: any) => (
                        <tr key={c._id} className="border-b border-border-subtle last:border-0 hover:bg-canvas-warm">
                          <td className="py-3 px-2 font-medium text-ink">{c.dealBuyer ?? '—'}</td>
                          <td className="py-3 px-2 mono tabular text-sm">{formatNGN(c.dealValueKobo ?? 0)}</td>
                          <td className="py-3 px-2 mono text-sm">{(c.percentBps / 100).toFixed(2)}%</td>
                          <td className="py-3 px-2 mono tabular text-base font-semibold text-brand-green">{formatNGN(c.commissionKobo)}</td>
                          <td className="py-3 px-2">
                            <StatusPill label={c.status === 'cleared' ? 'Paid' : c.status === 'pending' ? 'Pending' : 'Cancelled'} />
                          </td>
                          <td className="py-3 px-2 text-sm text-ink-soft tabular">{formatDateShort(c.setAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}

function KPI({ icon, label, value, tint, small }: { icon: React.ReactNode; label: string; value: string; tint: 'orange'|'green'|'gold'; small?: boolean }) {
  const t = tint === 'orange' ? 'bg-brand-orange-soft text-brand-orange'
        : tint === 'gold' ? 'bg-brand-gold-soft text-brand-gold'
        : 'bg-brand-green-soft text-brand-green';
  return (
    <Card>
      <CardContent className="pt-6 flex items-start gap-4">
        <span className={`grid h-10 w-10 place-items-center rounded-md ${t} shrink-0`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-2xs uppercase tracking-wider text-ink-soft font-medium">{label}</p>
          <p className={`font-heading text-ink mt-1 tabular mono truncate ${small ? 'text-xl' : 'text-3xl'}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
