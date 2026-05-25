'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/design/Card';
import { formatNGN, relativeTime } from '@/lib/format';
import { Users, ArrowRight } from 'lucide-react';

const MY_AGENTS = [
  { id: 'ag1', name: 'Tomi Akinola', email: 'tomi@ecocribsrealty.com', phone: '+2348012345678', joinedAt: Date.now() - 90 * 86400_000, activeDeals: 2, totalKobo: 17_000_000_00 },
  { id: 'ag2', name: 'David Ojo', email: 'david@ecocribsrealty.com', phone: '+2348023456789', joinedAt: Date.now() - 45 * 86400_000, activeDeals: 1, totalKobo: 8_750_000_00 },
  { id: 'ag3', name: 'Amaka Ude', email: 'amaka@ecocribsrealty.com', phone: '+2348034567890', joinedAt: Date.now() - 14 * 86400_000, activeDeals: 0, totalKobo: 0 },
];

export default function StaffAgents() {
  return (
    <div className="container py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl">My agents</h1>
        <p className="text-ink-soft mt-1">The agents the system has assigned to you, and what they&apos;ve brought in.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {MY_AGENTS.map((a) => (
              <div key={a.id} className="rounded-md border border-border-subtle p-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green-soft text-brand-green shrink-0">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{a.name}</p>
                    <p className="text-xs text-ink-soft truncate">{a.email}</p>
                    <p className="text-2xs text-ink-soft mono mt-0.5">{a.phone}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span><span className="text-ink-soft">Active:</span> <span className="font-medium">{a.activeDeals}</span></span>
                  <span className="mono tabular text-brand-green font-medium">{formatNGN(a.totalKobo)}</span>
                </div>
                <p className="mt-1 text-2xs text-ink-soft">Joined {relativeTime(a.joinedAt)}</p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block -mx-2 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-ink-soft border-b border-border-subtle">
                  <th className="text-left font-medium pb-2 px-2">Agent</th>
                  <th className="text-left font-medium pb-2 px-2">Phone</th>
                  <th className="text-left font-medium pb-2 px-2">Joined</th>
                  <th className="text-left font-medium pb-2 px-2">Active deals</th>
                  <th className="text-left font-medium pb-2 px-2">Pipeline</th>
                  <th className="text-left font-medium pb-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {MY_AGENTS.map((a) => (
                  <tr key={a.id} className="border-b border-border-subtle last:border-0 hover:bg-canvas-warm">
                    <td className="py-3 px-2">
                      <p className="font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-ink-soft">{a.email}</p>
                    </td>
                    <td className="py-3 px-2 mono tabular text-sm">{a.phone}</td>
                    <td className="py-3 px-2 text-sm text-ink-soft">{relativeTime(a.joinedAt)}</td>
                    <td className="py-3 px-2"><span className="font-medium">{a.activeDeals}</span></td>
                    <td className="py-3 px-2 mono tabular text-sm font-semibold text-brand-green">{formatNGN(a.totalKobo)}</td>
                    <td className="py-3 px-2">
                      <Link href="/staff/deals" className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline">
                        View deals <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
