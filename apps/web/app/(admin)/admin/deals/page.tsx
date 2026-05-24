'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@/lib/convex-hooks';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/design/Card';
import { StatusPill } from '@/components/design/StatusPill';
import { Input } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { formatNGN, relativeTime, shortId } from '@/lib/format';
import { IS_PREVIEW, PREVIEW_DEALS } from '@/lib/preview';
import { Search, Plus } from 'lucide-react';

export default function DealsList() {
  const [q, setQ] = useState('');
  const live = useQuery(api.deals.list, IS_PREVIEW ? 'skip' : { search: q || undefined, limit: 200 });

  const deals = useMemo(() => {
    const src = IS_PREVIEW ? PREVIEW_DEALS : (live ?? []);
    if (!q) return src;
    const needle = q.toLowerCase();
    return src.filter((d) => d.buyerName.toLowerCase().includes(needle) || d.buyerEmail.toLowerCase().includes(needle));
  }, [q, live]);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">Deals</h1>
          <p className="text-ink-soft mt-1">Every transaction across every stage.</p>
        </div>
        <Button><Plus className="h-4 w-4" /> New deal</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by buyer name…" className="pl-10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {deals.map((d: any) => (
              <Link
                key={d._id}
                href={`/admin/deals/${d._id}`}
                className="block rounded-md border border-border-subtle p-3 active:bg-canvas-warm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-medium text-ink truncate flex-1">{d.buyerName}</p>
                  <span className="mono text-2xs tabular text-ink-soft shrink-0">#{shortId(String(d._id))}</span>
                </div>
                <p className="text-xs text-ink-soft truncate">{d.buyerEmail}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <StatusPill label={d.statusLabel} />
                  <p className="mono tabular text-sm font-medium">{formatNGN(d.purchasePriceKobo)}</p>
                </div>
                <p className="mt-2 text-2xs text-ink-soft">{relativeTime(d.updatedAt)}</p>
              </Link>
            ))}
            {deals.length === 0 && (
              <p className="py-12 text-center text-ink-soft text-sm">No deals match.</p>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block -mx-2 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-ink-soft border-b border-border-subtle">
                  <th className="text-left font-medium pb-2 px-2">Deal</th>
                  <th className="text-left font-medium pb-2 px-2">Buyer</th>
                  <th className="text-left font-medium pb-2 px-2">Price</th>
                  <th className="text-left font-medium pb-2 px-2">Status</th>
                  <th className="text-left font-medium pb-2 px-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d: any) => (
                  <tr key={d._id} className="border-b border-border-subtle last:border-0 hover:bg-canvas-warm">
                    <td className="py-3 px-2 mono text-xs tabular text-ink-soft">#{shortId(String(d._id))}</td>
                    <td className="py-3 px-2">
                      <Link href={`/admin/deals/${d._id}`} className="font-medium text-ink hover:text-brand-orange">
                        {d.buyerName}
                      </Link>
                      <p className="text-xs text-ink-soft">{d.buyerEmail}</p>
                    </td>
                    <td className="py-3 px-2 mono tabular text-sm">{formatNGN(d.purchasePriceKobo)}</td>
                    <td className="py-3 px-2"><StatusPill label={d.statusLabel} /></td>
                    <td className="py-3 px-2 text-sm text-ink-soft tabular">{relativeTime(d.updatedAt)}</td>
                  </tr>
                ))}
                {deals.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-ink-soft text-sm">No deals match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
