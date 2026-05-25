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
import { Wallet, TrendingUp, CheckCircle2, Download, Send, Pencil, Check, X } from 'lucide-react';

const SEED: any[] = PREVIEW_COMMISSIONS.map((c) => ({
  ...c,
  agentName: c._id === 'com_demo_001' ? 'Tomi Akinola' : c._id === 'com_demo_002' ? 'David Ojo' : 'Amaka Ude',
  staffName: 'Folake Bello',
  propertyName: c.dealBuyer === 'Adaeze Nwosu' ? 'Plot 14, The Pastures' : c.dealBuyer === 'Ifeanyi Okeke' ? 'Plot 27, Caribbean Lake City' : 'Plot 3, Uloma Estate',
}));

export default function CommissionsLedger() {
  const live = useQuery(api.commissions.listAll, IS_PREVIEW ? 'skip' : {});
  const liveRows = IS_PREVIEW ? SEED : (live ?? []);
  const markCleared = useMutation(api.commissions.markCleared);
  const setForDeal = useMutation(api.commissions.setForDeal);

  // Demo-mode local override so the user can see the % change update live.
  const [demoOverrides, setDemoOverrides] = useState<Record<string, number>>({});
  const rows = useMemo(() => {
    if (!IS_PREVIEW || Object.keys(demoOverrides).length === 0) return liveRows;
    return liveRows.map((r: any) => {
      const bps = demoOverrides[r._id];
      if (bps === undefined) return r;
      const commissionKobo = Math.round(((r.dealValueKobo ?? 0) * bps) / 10000);
      return { ...r, percentBps: bps, commissionKobo };
    });
  }, [liveRows, demoOverrides]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const beginEdit = (r: any) => {
    setEditingId(r._id);
    setEditValue((r.percentBps / 100).toFixed(2));
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };
  const saveEdit = async (r: any) => {
    const parsed = Number(editValue);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 50) {
      alert('Enter a percentage between 0 and 50.');
      return;
    }
    const percentBps = Math.round(parsed * 100);
    setSaving(true);
    try {
      if (IS_PREVIEW) {
        // Demo mode — no-op against the backend, just patch local state.
        setDemoOverrides((prev) => ({ ...prev, [r._id]: percentBps }));
      } else {
        await setForDeal({
          dealId: r.dealId as any,
          agentUserId: r.agentUserId as any,
          percentBps,
        });
      }
      setEditingId(null);
      setEditValue('');
    } catch (e: any) {
      alert(`Could not update commission: ${e?.message ?? 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

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
                {filtered.map((r: any) => {
                  const isEditing = editingId === r._id;
                  const isPending = r.status === 'pending';
                  return (
                    <div key={r._id} className="rounded-md border border-border-subtle p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink truncate">{r.agentName}</p>
                          <p className="text-xs text-ink-soft truncate">→ {r.dealBuyer}</p>
                          <p className="text-2xs text-ink-soft mono mt-0.5">{r.propertyName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="mono tabular text-base font-semibold text-brand-green">{formatNGN(r.commissionKobo)}</p>
                          {isEditing ? (
                            <div className="mt-1 flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step={0.05}
                                min={0}
                                max={50}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(r);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                                disabled={saving}
                                className="w-16 rounded-sm border border-border bg-white px-1.5 py-0.5 text-xs mono text-ink text-right focus:outline-none focus:ring-1 focus:ring-brand-orange"
                              />
                              <span className="text-2xs text-ink-soft mono">%</span>
                              <button
                                onClick={() => saveEdit(r)}
                                disabled={saving}
                                className="grid h-6 w-6 place-items-center rounded-sm bg-brand-green text-white hover:opacity-90 disabled:opacity-50"
                                aria-label="Save"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="grid h-6 w-6 place-items-center rounded-sm border border-border text-ink-soft hover:text-ink disabled:opacity-50"
                                aria-label="Cancel"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : isPending ? (
                            <button
                              onClick={() => beginEdit(r)}
                              className="mt-0.5 inline-flex items-center gap-1 text-2xs text-ink-soft mono hover:text-brand-orange"
                              aria-label="Edit percentage"
                            >
                              <span>{(r.percentBps / 100).toFixed(2)}% of {formatNGN(r.dealValueKobo)}</span>
                              <Pencil className="h-3 w-3" />
                            </button>
                          ) : (
                            <p className="text-2xs text-ink-soft mono">{(r.percentBps / 100).toFixed(2)}% of {formatNGN(r.dealValueKobo)}</p>
                          )}
                          <div className="mt-1.5">
                            <StatusPill label={r.status === 'cleared' ? 'Paid' : 'Pending'} />
                          </div>
                        </div>
                      </div>
                      {isPending && (
                        <Button size="sm" variant="outline" onClick={() => clearRow(r._id)} className="w-full mt-3">
                          Mark paid
                        </Button>
                      )}
                    </div>
                  );
                })}
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
                    {filtered.map((r: any) => {
                      const isEditing = editingId === r._id;
                      const isPending = r.status === 'pending';
                      return (
                        <tr key={r._id} className="border-b border-border-subtle last:border-0 hover:bg-canvas-warm">
                          <td className="py-3 px-2 font-medium text-ink">{r.agentName}</td>
                          <td className="py-3 px-2 text-sm">{r.dealBuyer}</td>
                          <td className="py-3 px-2 text-sm text-ink-muted truncate max-w-[180px]">{r.propertyName}</td>
                          <td className="py-3 px-2 mono tabular text-sm">{formatNGN(r.dealValueKobo)}</td>
                          <td className="py-3 px-2 mono text-sm">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step={0.05}
                                  min={0}
                                  max={50}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(r);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  autoFocus
                                  disabled={saving}
                                  className="w-16 rounded-sm border border-border bg-white px-1.5 py-0.5 text-sm mono text-ink text-right focus:outline-none focus:ring-1 focus:ring-brand-orange"
                                />
                                <span className="text-xs text-ink-soft">%</span>
                                <button
                                  onClick={() => saveEdit(r)}
                                  disabled={saving}
                                  className="grid h-6 w-6 place-items-center rounded-sm bg-brand-green text-white hover:opacity-90 disabled:opacity-50"
                                  aria-label="Save"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={saving}
                                  className="grid h-6 w-6 place-items-center rounded-sm border border-border text-ink-soft hover:text-ink disabled:opacity-50"
                                  aria-label="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : isPending ? (
                              <button
                                onClick={() => beginEdit(r)}
                                className="group inline-flex items-center gap-1.5 rounded-sm px-1 -mx-1 hover:bg-brand-orange-soft hover:text-brand-orange transition-colors"
                                title="Edit percentage"
                              >
                                <span>{(r.percentBps / 100).toFixed(2)}%</span>
                                <Pencil className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                              </button>
                            ) : (
                              <span>{(r.percentBps / 100).toFixed(2)}%</span>
                            )}
                          </td>
                          <td className="py-3 px-2 mono tabular text-sm font-semibold text-brand-green">{formatNGN(r.commissionKobo)}</td>
                          <td className="py-3 px-2"><StatusPill label={r.status === 'cleared' ? 'Paid' : 'Pending'} /></td>
                          <td className="py-3 px-2 text-xs text-ink-soft">{r.staffName ?? '—'}</td>
                          <td className="py-3 px-2">
                            {isPending && (
                              <Button size="sm" variant="outline" onClick={() => clearRow(r._id)}>Mark paid</Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
