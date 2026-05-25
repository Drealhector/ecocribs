'use client';

import Link from 'next/link';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { formatNGN } from '@/lib/format';
import { IS_PREVIEW, PREVIEW_DEALS, PREVIEW_PROPERTIES, PREVIEW_COMMISSIONS } from '@/lib/preview';
import { TrendingUp, Users, UserCircle2, Wallet, ArrowRight } from 'lucide-react';

// Preview seed — staff-by-staff breakdown of the org
const PREVIEW_STAFF_PERFORMANCE = [
  { name: 'Folake Bello', role: 'Manager', agentsCount: 3, dealsCount: 4, totalKobo: 26_950_000_00 },
  { name: 'Tomi Akinola', role: 'Documentation Officer', agentsCount: 2, dealsCount: 1, totalKobo: 8_100_000_00 },
];

export default function AdminOverview() {
  const liveDeals = useQuery(api.deals.list, IS_PREVIEW ? 'skip' : { limit: 200 });
  const deals = IS_PREVIEW ? PREVIEW_DEALS : liveDeals;

  if (deals === undefined) return <Loading />;

  const totalNgn = deals.reduce((s, d) => s + d.purchasePriceKobo, 0);
  const pendingCommissions = PREVIEW_COMMISSIONS.filter((c) => c.status === 'pending').reduce((s, c) => s + c.commissionKobo, 0);
  const paidCommissions = PREVIEW_COMMISSIONS.filter((c) => c.status === 'cleared').reduce((s, c) => s + c.commissionKobo, 0);
  const totalStaff = PREVIEW_STAFF_PERFORMANCE.length;
  const totalAgents = PREVIEW_STAFF_PERFORMANCE.reduce((s, x) => s + x.agentsCount, 0);

  return (
    <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <p className="text-2xs uppercase tracking-wider text-brand-green font-medium">Admin</p>
        <h1 className="font-heading text-3xl mt-1">Overview</h1>
        <p className="text-ink-soft mt-1">The whole organisation at a glance.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPI icon={<TrendingUp className="h-5 w-5" />} label="Pipeline value" value={formatNGN(totalNgn)} tint="green" small />
        <KPI icon={<Users className="h-5 w-5" />} label="Active staff" value={String(totalStaff)} tint="green" />
        <KPI icon={<UserCircle2 className="h-5 w-5" />} label="Active agents" value={String(totalAgents)} tint="green" />
        <KPI icon={<Wallet className="h-5 w-5" />} label="Pending payouts" value={formatNGN(pendingCommissions)} tint="orange" small />
      </div>

      {/* Per-staff performance */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Staff performance</h2>
            <Link href="/admin/users" className="text-sm text-brand-green hover:underline">Manage team →</Link>
          </div>
          <div className="space-y-2">
            {PREVIEW_STAFF_PERFORMANCE.map((s) => (
              <div key={s.name} className="rounded-md border border-border-subtle p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-ink-soft">{s.role}</p>
                  </div>
                  <p className="mono tabular text-sm font-semibold">{formatNGN(s.totalKobo)}</p>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-ink-muted">
                  <span><span className="text-ink-soft">Agents:</span> <span className="font-medium text-ink">{s.agentsCount}</span></span>
                  <span><span className="text-ink-soft">Deals:</span> <span className="font-medium text-ink">{s.dealsCount}</span></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commissions snapshot */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Commissions</h2>
            <Link href="/admin/commissions" className="text-sm text-brand-green hover:underline inline-flex items-center gap-1">
              Open ledger <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-brand-orange-soft p-4">
              <p className="text-2xs uppercase tracking-wider font-medium text-brand-orange">Pending payout</p>
              <p className="font-heading text-xl text-ink mt-1 mono tabular">{formatNGN(pendingCommissions)}</p>
            </div>
            <div className="rounded-md bg-brand-green-soft p-4">
              <p className="text-2xs uppercase tracking-wider font-medium text-brand-green">Paid out</p>
              <p className="font-heading text-xl text-ink mt-1 mono tabular">{formatNGN(paidCommissions)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent deals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Recent deals</h2>
            <Link href="/admin/deals" className="text-sm text-brand-green hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {deals.slice(0, 5).map((d) => {
              const prop = PREVIEW_PROPERTIES[d.propertyId as unknown as string];
              return (
                <Link
                  key={d._id}
                  href={`/admin/deals/${d._id}`}
                  className="flex items-start justify-between gap-3 rounded-md border border-border-subtle p-3 hover:bg-canvas-warm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{d.buyerName}</p>
                    <p className="text-xs text-ink-soft truncate">{prop?.name ?? '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="mono tabular text-sm">{formatNGN(d.purchasePriceKobo)}</p>
                    <div className="mt-1.5"><StatusPill label={d.statusLabel} /></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
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
          <p className={`font-heading text-ink mt-1 tabular truncate ${small ? 'mono text-xl' : 'text-3xl'}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
