'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { Button } from '@/components/design/Button';
import { formatNGN, formatDateShort, shortId } from '@/lib/format';
import { IS_PREVIEW, PREVIEW_COMMISSIONS } from '@/lib/preview';
import { Wallet, TrendingUp, CheckCircle2, Download, Send } from 'lucide-react';

const SEED: any[] = PREVIEW_COMMISSIONS.map((c) => ({
  ...c,
  agentName: c._id === 'com_demo_001' ? 'Tomi Akinola' : c._id === 'com_demo_002' ? 'David Ojo' : 'Amaka Ude',
  staffName: 'Folake Bello',
  propertyName: c.dealBuyer === 'Adaeze Nwosu' ? 'Plot 14, The Pastures' : c.dealBuyer === 'Ifeanyi Okeke' ? 'Plot 27, Caribbean Lake City' : 'Plot 3, Uloma Estate',
}));

export default function CommissionsLedger() {
  const live = useQuery(api.commissions.listAll, IS_PREVIEW ? 'skip' : {});
  const rows = IS_PREVIEW ? SEED : (live ?? []);
  const markCleared = useMutation(api.commissions.markCleared);

  const [filter, setFilter] = useState<'all' | 'pending' | 'cleared'>('all');
  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((r: any) => r.status === filter);
  }, [filter, rows]);

  const totals = useMemo(() => {
    const pending = rows.filter((r: any) => r.status === 'pending').reduce((s: number, r: any) => s + r.commissionKobo, 0);
    const cleared = rows.filter((r: any) => r.status === 'cleared').reduce((s: number, r: any) => s + r.commissionKobo, 0);
    return { pending, cleared, total: pending + cleared };
  }, [rows]);

  const exportCsv = () => {
    const head = ['Date set', 'Agent', 'Customer', 'Property', 'Deal value (NGN)', 'Rate %', 'Commission (NGN)', 'Status', 'Cleared by', 'Cleared date'].join(',');
    const lines = rows.map((r: any) => [
      formatDateShort(r.setAt),
      r.agentName ?? '',
      r.dealBuyer ?? '',
      r.propertyName ?? '',
      (r.dealValueKobo ?? 0) / 100,
      ((r.percentBps ?? 0) / 100).toFixed(2),
      (r.commissionKobo ?? 0) / 100,
      r.status,
      r.staffName ?? '',
      r.clearedAt ? formatDateShort(r.clearedAt) : '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [head, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearRow = async (commissionId: string) => {
    if (IS_PREVIEW) {
      alert('Demo mode — in production this would mark the row as cleared and notify the agent.');
      return;
    }
    if (!confirm('Mark this commission as paid? This is recorded in the audit log.')) return;
    await markCleared({ commissionId: commissionId as any });
  };

  return (
    <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Commission ledger</h1>
          <p className="text-ink-soft mt-1">Every commission set, paid, or pending across all agents.</p>
        </div>
        <Button onClick={exportCsv} variant="outline">
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KPI icon={<Wallet className="h-5 w-5" />} label="Pending payout" value={formatNGN(totals.pending)} tint="orange" />
        <KPI icon={<CheckCircle2 className="h-5 w-5" />} label="Paid out" value={formatNGN(totals.cleared)} tint="green" />
        <KPI icon={<TrendingUp className="h-5 w-5" />} label="Lifetime total" value={formatNGN(totals.total)} tint="green" />
      </div>

      <div className="flex items-center gap-1 rounded-md border border-border bg-canvas p-1 w-fit text-sm">
        {(['all', 'pending', 'cleared'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
              filter === k ? 'bg-brand-orange text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {k === 'all' ? `All (${rows.length})` : k === 'pending' ? 'Pending' : 'Paid'}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-ink-soft text-sm">No commissions yet under this filter.</p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filtered.map((r: any) => (
                  <div key={r._id} className="rounded-md border border-border-subtle p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink truncate">{r.agentName}</p>
                        <p className="text-xs text-ink-soft truncate">→ {r.dealBuyer}</p>
                        <p className="text-2xs text-ink-soft mono mt-0.5">{r.propertyName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="mono tabular text-base font-semibold text-brand-green">{formatNGN(r.commissionKobo)}</p>
                        <p className="text-2xs text-ink-soft mono">{(r.percentBps / 100).toFixed(2)}% of {formatNGN(r.dealValueKobo)}</p>
                        <div className="mt-1.5">
                          <StatusPill label={r.status === 'cleared' ? 'Paid' : 'Pending'} />
                        </div>
                      </div>
                    </div>
                    {r.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => clearRow(r._id)} className="w-full mt-3">
                        Mark paid
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block -mx-2 overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-ink-soft border-b border-border-subtle">
                      <th className="text-left font-medium pb-2 px-2">Agent</th>
                      <th className="text-left font-medium pb-2 px-2">Customer</th>
                      <th className="text-left font-medium pb-2 px-2">Property</th>
                      <th className="text-left font-medium pb-2 px-2">Deal value</th>
                      <th className="text-left font-medium pb-2 px-2">%</th>
                      <th className="text-left font-medium pb-2 px-2">Commission</th>
                      <th className="text-left font-medium pb-2 px-2">Status</th>
                      <th className="text-left font-medium pb-2 px-2">Cleared by</th>
                      <th className="text-left font-medium pb-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r: any) => (
                      <tr key={r._id} className="border-b border-border-subtle last:border-0 hover:bg-canvas-warm">
                        <td className="py-3 px-2 font-medium text-ink">{r.agentName}</td>
                        <td className="py-3 px-2 text-sm">{r.dealBuyer}</td>
                        <td className="py-3 px-2 text-sm text-ink-muted truncate max-w-[180px]">{r.propertyName}</td>
                        <td className="py-3 px-2 mono tabular text-sm">{formatNGN(r.dealValueKobo)}</td>
                        <td className="py-3 px-2 mono text-sm">{(r.percentBps / 100).toFixed(2)}%</td>
                        <td className="py-3 px-2 mono tabular text-sm font-semibold text-brand-green">{formatNGN(r.commissionKobo)}</td>
                        <td className="py-3 px-2"><StatusPill label={r.status === 'cleared' ? 'Paid' : 'Pending'} /></td>
                        <td className="py-3 px-2 text-xs text-ink-soft">{r.staffName ?? '—'}</td>
                        <td className="py-3 px-2">
                          {r.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => clearRow(r._id)}>Mark paid</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: 'orange'|'green' }) {
  const t = tint === 'orange' ? 'bg-brand-orange-soft text-brand-orange' : 'bg-brand-green-soft text-brand-green';
  return (
    <Card>
      <CardContent className="pt-6 flex items-start gap-4">
        <span className={`grid h-10 w-10 place-items-center rounded-md ${t} shrink-0`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-2xs uppercase tracking-wider text-ink-soft font-medium">{label}</p>
          <p className="font-heading text-ink mt-1 tabular mono text-xl truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
