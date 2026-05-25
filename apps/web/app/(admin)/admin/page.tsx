'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { formatNGN } from '@/lib/format';
import { IS_PREVIEW, PREVIEW_DEALS, PREVIEW_PROPERTIES, PREVIEW_COMMISSIONS } from '@/lib/preview';
import { TrendingUp, Users, UserCircle2, Wallet, ArrowRight, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';

// Preview seed — staff-by-staff breakdown of the org (base = "This month")
const PREVIEW_STAFF_PERFORMANCE = [
  {
    name: 'Folake Bello',
    role: 'Manager',
    agentsCount: 3,
    customersOnboarded: 6,
    dealsClosed: 4,
    pipelineKobo: 26_950_000_00,
    commissionsClearedKobo: 1_347_500_00,
  },
  {
    name: 'Tomi Akinola',
    role: 'Documentation Officer',
    agentsCount: 2,
    customersOnboarded: 3,
    dealsClosed: 1,
    pipelineKobo: 8_100_000_00,
    commissionsClearedKobo: 405_000_00,
  },
  {
    name: 'Chinaza Okafor',
    role: 'Senior Agent',
    agentsCount: 4,
    customersOnboarded: 8,
    dealsClosed: 5,
    pipelineKobo: 34_200_000_00,
    commissionsClearedKobo: 1_710_000_00,
  },
];

type PeriodKey = 'this' | 'p3' | 'p6' | 'p12' | 'all';
const PERIOD_OPTIONS: { key: PeriodKey; label: string; multiplier: number }[] = [
  { key: 'this', label: 'This month', multiplier: 1 },
  { key: 'p3', label: 'Past 3 months', multiplier: 2.6 },
  { key: 'p6', label: 'Past 6 months', multiplier: 4.2 },
  { key: 'p12', label: 'Past 12 months', multiplier: 7.8 },
  { key: 'all', label: 'All time', multiplier: 11.4 },
];

type SortKey = 'name' | 'agentsCount' | 'customersOnboarded' | 'dealsClosed' | 'pipelineKobo' | 'commissionsClearedKobo' | 'avgDealKobo';
type SortDir = 'desc' | 'asc' | null;

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

      {/* Set commission % on any deal — inline */}
      <SetCommissionsCard deals={deals} />

      {/* Per-staff performance — monthly table */}
      <StaffPerformanceCard />

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

function SetCommissionsCard({ deals }: { deals: any[] }) {
  // Local per-deal commission state (demo). In prod, hydrate from
  // api.commissions.listAll and call api.commissions.setForDeal on save.
  const [pct, setPct] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const top = deals.slice(0, 5);

  const save = async (deal: any) => {
    const raw = pct[deal._id] ?? '';
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 50) {
      alert('Enter a percentage between 0 and 50.');
      return;
    }
    setSavingId(deal._id);
    await new Promise((r) => setTimeout(r, 300));
    setSaved((prev) => ({ ...prev, [deal._id]: n }));
    setSavingId(null);
  };

  return (
    <Card className="border-brand-green/30">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4 flex-wrap">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-green-soft text-brand-green shrink-0">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-xl">Set commissions</h2>
            <p className="text-sm text-ink-soft mt-0.5">
              Type a percentage next to each deal — the agent gets credited that share when the deal closes.
            </p>
          </div>
          <Link href="/admin/commissions" className="text-sm text-brand-green hover:underline inline-flex items-center gap-1 self-center">
            Full ledger <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {top.map((d) => {
            const prop = PREVIEW_PROPERTIES[d.propertyId as unknown as string];
            const currentPct = pct[d._id] ?? '';
            const isSaved = saved[d._id] !== undefined;
            const previewKobo = Number(currentPct) > 0
              ? Math.round((d.purchasePriceKobo * Number(currentPct)) / 100)
              : 0;

            return (
              <div key={d._id} className="rounded-md border border-border-subtle p-3 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink truncate">{d.buyerName}</p>
                  <p className="text-xs text-ink-soft truncate">{prop?.name ?? '—'} · {formatNGN(d.purchasePriceKobo)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="50"
                      value={currentPct}
                      onChange={(e) => setPct((prev) => ({ ...prev, [d._id]: e.target.value }))}
                      placeholder="0.00"
                      className="w-24 h-10 rounded-md border border-border bg-canvas px-3 pr-8 text-sm text-right text-ink focus-visible:outline-none focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange/30"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-soft">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => save(d)}
                    disabled={!currentPct || savingId === d._id}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-md bg-brand-green text-white text-sm font-medium hover:bg-brand-green-deep disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingId === d._id ? 'Saving…' : isSaved ? <><Check className="h-4 w-4" /> Saved</> : 'Set'}
                  </button>
                </div>
                {Number(currentPct) > 0 && (
                  <p className="text-2xs text-brand-green w-full mono tabular sm:w-auto sm:ml-auto sm:text-right">
                    Agent will earn {formatNGN(previewKobo)} on this deal
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StaffPerformanceCard() {
  const [period, setPeriod] = useState<PeriodKey>('this');
  // Default: best performer first — sorted by pipeline ₦ descending
  const [sortKey, setSortKey] = useState<SortKey | null>('pipelineKobo');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const periodOption = PERIOD_OPTIONS.find((p) => p.key === period) ?? PERIOD_OPTIONS[0];
  const multiplier = periodOption.multiplier;

  // Apply period multiplier to the base seed (agents count is a headcount, not period-scaled)
  const rows = useMemo(() => {
    const scaled = PREVIEW_STAFF_PERFORMANCE.map((s) => {
      const customersOnboarded = Math.round(s.customersOnboarded * multiplier);
      const dealsClosed = Math.round(s.dealsClosed * multiplier);
      const pipelineKobo = Math.round(s.pipelineKobo * multiplier);
      const commissionsClearedKobo = Math.round(s.commissionsClearedKobo * multiplier);
      const avgDealKobo = dealsClosed > 0 ? Math.round(pipelineKobo / dealsClosed) : 0;
      return {
        name: s.name,
        role: s.role,
        agentsCount: s.agentsCount,
        customersOnboarded,
        dealsClosed,
        pipelineKobo,
        commissionsClearedKobo,
        avgDealKobo,
      };
    });

    if (!sortKey || !sortDir) return scaled;
    const sorted = [...scaled].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return sortDir === 'asc' ? an - bn : bn - an;
    });
    return sorted;
  }, [multiplier, sortKey, sortDir]);

  // Totals row
  const totals = useMemo(() => {
    const t = rows.reduce(
      (acc, r) => ({
        agentsCount: acc.agentsCount + r.agentsCount,
        customersOnboarded: acc.customersOnboarded + r.customersOnboarded,
        dealsClosed: acc.dealsClosed + r.dealsClosed,
        pipelineKobo: acc.pipelineKobo + r.pipelineKobo,
        commissionsClearedKobo: acc.commissionsClearedKobo + r.commissionsClearedKobo,
      }),
      { agentsCount: 0, customersOnboarded: 0, dealsClosed: 0, pipelineKobo: 0, commissionsClearedKobo: 0 }
    );
    const avgDealKobo = t.dealsClosed > 0 ? Math.round(t.pipelineKobo / t.dealsClosed) : 0;
    return { ...t, avgDealKobo };
  }, [rows]);

  function cycleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('desc');
      return;
    }
    // same key — cycle desc -> asc -> none
    if (sortDir === 'desc') setSortDir('asc');
    else if (sortDir === 'asc') {
      setSortKey(null);
      setSortDir(null);
    } else {
      setSortDir('desc');
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-heading text-xl">Staff performance</h2>
            <Link href="/admin/users" className="text-sm text-brand-green hover:underline">Manage team →</Link>
          </div>
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              className="appearance-none rounded-md border border-border-subtle bg-canvas px-3 py-2 pr-8 text-sm text-ink hover:border-border focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              aria-label="Select period"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-2xs uppercase tracking-wider text-ink-soft">
                <th className="py-2.5 pr-2 w-12 font-medium">Rank</th>
                <SortHeader label="Staff" align="left" active={sortKey === 'name'} dir={sortDir} onClick={() => cycleSort('name')} />
                <SortHeader label="Agents" align="right" active={sortKey === 'agentsCount'} dir={sortDir} onClick={() => cycleSort('agentsCount')} />
                <SortHeader label="Customers onboarded" align="right" active={sortKey === 'customersOnboarded'} dir={sortDir} onClick={() => cycleSort('customersOnboarded')} />
                <SortHeader label="Deals closed" align="right" active={sortKey === 'dealsClosed'} dir={sortDir} onClick={() => cycleSort('dealsClosed')} />
                <SortHeader label="Pipeline value" align="right" active={sortKey === 'pipelineKobo'} dir={sortDir} onClick={() => cycleSort('pipelineKobo')} />
                <SortHeader label="Commissions cleared" align="right" active={sortKey === 'commissionsClearedKobo'} dir={sortDir} onClick={() => cycleSort('commissionsClearedKobo')} />
                <SortHeader label="Avg deal size" align="right" active={sortKey === 'avgDealKobo'} dir={sortDir} onClick={() => cycleSort('avgDealKobo')} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.name} className="border-b border-border-subtle last:border-b-0 hover:bg-canvas-warm/50">
                  <td className="py-3 pr-2">
                    <RankBadge rank={i + 1} />
                  </td>
                  <td className="py-3 pr-3">
                    <p className="font-medium text-ink">{r.name}</p>
                    <p className="text-xs text-ink-soft">{r.role}</p>
                  </td>
                  <td className="py-3 px-3 text-right mono tabular text-ink">{r.agentsCount}</td>
                  <td className="py-3 px-3 text-right mono tabular text-ink">{r.customersOnboarded}</td>
                  <td className="py-3 px-3 text-right mono tabular text-ink">{r.dealsClosed}</td>
                  <td className="py-3 px-3 text-right mono tabular text-ink">{formatNGN(r.pipelineKobo)}</td>
                  <td className="py-3 px-3 text-right mono tabular text-ink">{formatNGN(r.commissionsClearedKobo)}</td>
                  <td className="py-3 pl-3 text-right mono tabular text-ink">{formatNGN(r.avgDealKobo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border-subtle bg-canvas-warm/40">
                <td className="py-3 pr-2"></td>
                <td className="py-3 pr-3 font-semibold text-ink text-2xs uppercase tracking-wider">Totals</td>
                <td className="py-3 px-3 text-right mono tabular font-semibold text-ink">{totals.agentsCount}</td>
                <td className="py-3 px-3 text-right mono tabular font-semibold text-ink">{totals.customersOnboarded}</td>
                <td className="py-3 px-3 text-right mono tabular font-semibold text-ink">{totals.dealsClosed}</td>
                <td className="py-3 px-3 text-right mono tabular font-semibold text-ink">{formatNGN(totals.pipelineKobo)}</td>
                <td className="py-3 px-3 text-right mono tabular font-semibold text-ink">{formatNGN(totals.commissionsClearedKobo)}</td>
                <td className="py-3 pl-3 text-right mono tabular font-semibold text-ink">{formatNGN(totals.avgDealKobo)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile: stacked cards per staff */}
        <div className="md:hidden space-y-3">
          {rows.map((r, i) => (
            <div key={r.name} className="rounded-md border border-border-subtle p-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <RankBadge rank={i + 1} />
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{r.name}</p>
                    <p className="text-xs text-ink-soft truncate">{r.role}</p>
                  </div>
                </div>
                <p className="mono tabular text-sm font-semibold text-ink">{formatNGN(r.pipelineKobo)}</p>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <MobileStat label="Agents" value={String(r.agentsCount)} />
                <MobileStat label="Customers" value={String(r.customersOnboarded)} />
                <MobileStat label="Deals closed" value={String(r.dealsClosed)} />
                <MobileStat label="Avg deal" value={formatNGN(r.avgDealKobo)} />
                <MobileStat label="Pipeline" value={formatNGN(r.pipelineKobo)} />
                <MobileStat label="Commissions cleared" value={formatNGN(r.commissionsClearedKobo)} />
              </dl>
            </div>
          ))}
          {/* Mobile totals */}
          <div className="rounded-md border-2 border-border-subtle bg-canvas-warm/40 p-3">
            <p className="text-2xs uppercase tracking-wider font-semibold text-ink mb-2">Totals</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <MobileStat label="Agents" value={String(totals.agentsCount)} bold />
              <MobileStat label="Customers" value={String(totals.customersOnboarded)} bold />
              <MobileStat label="Deals closed" value={String(totals.dealsClosed)} bold />
              <MobileStat label="Avg deal" value={formatNGN(totals.avgDealKobo)} bold />
              <MobileStat label="Pipeline" value={formatNGN(totals.pipelineKobo)} bold />
              <MobileStat label="Commissions cleared" value={formatNGN(totals.commissionsClearedKobo)} bold />
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SortHeader({
  label,
  align,
  active,
  dir,
  onClick,
}: {
  label: string;
  align: 'left' | 'right';
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  const Icon = !active || !dir ? ArrowUpDown : dir === 'desc' ? ArrowDown : ArrowUp;
  return (
    <th className={`py-2.5 font-medium ${align === 'right' ? 'text-right pl-3' : 'pr-3'}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 hover:text-ink transition-colors ${active ? 'text-ink' : ''} ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        <span>{label}</span>
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

function MobileStat({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`mono tabular text-ink ${bold ? 'font-semibold' : ''}`}>{value}</dd>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-heading text-sm font-semibold shrink-0 ${
        isFirst ? 'bg-brand-gold text-white shadow-soft' :
        isSecond ? 'bg-brand-green-soft text-brand-green border border-brand-green/30' :
        isThird ? 'bg-brand-orange-soft text-brand-orange border border-brand-orange/30' :
        'bg-canvas-warm text-ink-soft border border-border'
      }`}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
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
