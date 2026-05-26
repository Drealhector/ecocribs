'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  CheckCircle2,
  Users,
  BadgeDollarSign,
  UserPlus,
  ExternalLink,
  ScrollText,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/design/Card';
import { formatNGN, relativeTime } from '@/lib/format';
import { PREVIEW_DEALS, PREVIEW_COMMISSIONS } from '@/lib/preview';

const DAY_MS = 86_400_000;
const MONTH_MS = 30 * DAY_MS;

const ADMIN_ROSTER = [
  {
    name: 'Adesola Adeyemi',
    email: 'adesola@ecocribsrealty.com',
    joinedAt: Date.now() - 240 * DAY_MS,
    role: 'Principal' as const,
    initialsTint: 'gold' as const,
  },
  {
    name: 'Funmi Bello',
    email: 'funmi@ecocribsrealty.com',
    joinedAt: Date.now() - 180 * DAY_MS,
    role: 'Admin' as const,
    initialsTint: 'green' as const,
  },
  {
    name: 'Kunle Adeyemi',
    email: 'kunle@ecocribsrealty.com',
    joinedAt: Date.now() - 95 * DAY_MS,
    role: 'Admin' as const,
    initialsTint: 'orange' as const,
  },
];

type ActivityKind = 'commission' | 'deal' | 'signup' | 'system';

const RECENT_ACTIVITY: { text: string; ts: number; kind: ActivityKind }[] = [
  { text: "Funmi Bello updated commission for Adaeze Nwosu's deal (2.5%)", ts: Date.now() - 12 * 60_000, kind: 'commission' },
  { text: 'Kunle Adeyemi onboarded Tolulope Bakare', ts: Date.now() - 60 * 60_000, kind: 'signup' },
  { text: "Ifeanyi Okeke's deal moved to AWAITING_GOVERNORS_CONSENT", ts: Date.now() - 3 * 60 * 60_000, kind: 'deal' },
  { text: 'Tomi Akinola (agent) signed up', ts: Date.now() - 1 * DAY_MS, kind: 'signup' },
  { text: 'Funmi Bello cleared commission ₦186,000 for Chinwe Adeyemi', ts: Date.now() - 2 * DAY_MS, kind: 'commission' },
  { text: 'New estate listing added: Plot 22, Aphric Park', ts: Date.now() - 3 * DAY_MS, kind: 'deal' },
  { text: 'Adesola Adeyemi invited new admin: Kunle Adeyemi', ts: Date.now() - 95 * DAY_MS, kind: 'system' },
  { text: 'EcoCribs Realty workspace created', ts: Date.now() - 365 * DAY_MS, kind: 'system' },
];

export default function PrincipalOverview() {
  const stats = useMemo(() => {
    const now = Date.now();
    const monthAgo = now - MONTH_MS;

    const pipelineKobo = PREVIEW_DEALS
      .filter((d) => d.state !== 'COMPLETED' && d.state !== 'ARCHIVED')
      .reduce((s, d) => s + d.purchasePriceKobo, 0);

    const closedThisMonth = PREVIEW_DEALS.filter(
      (d) => d.state === 'COMPLETED' && ((d as any).completedAt ?? d.updatedAt) >= monthAgo,
    );
    const closedCount = closedThisMonth.length;
    const closedValueKobo = closedThisMonth.reduce((s, d) => s + d.purchasePriceKobo, 0);

    const commissionsClearedKobo = PREVIEW_COMMISSIONS
      .filter((c) => c.status === 'cleared' && (c.clearedAt ?? 0) >= monthAgo)
      .reduce((s, c) => s + c.commissionKobo, 0);
    const commissionsClearedCount = PREVIEW_COMMISSIONS
      .filter((c) => c.status === 'cleared' && (c.clearedAt ?? 0) >= monthAgo).length;

    return {
      pipelineKobo,
      closedCount,
      closedValueKobo,
      commissionsClearedKobo,
      commissionsClearedCount,
    };
  }, []);

  // "This month" mini stats (demo-seeded; ties to KPIs above where applicable)
  const monthMini = [
    { label: 'New agents', value: '4' },
    { label: 'New customers', value: '11' },
    { label: 'Documents signed', value: '23' },
    { label: 'Commissions cleared', value: String(stats.commissionsClearedCount) },
  ];

  return (
    <div className="container py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* (a) Header strip */}
      <div>
        <p className="text-2xs uppercase tracking-wider text-brand-gold font-medium">Principal</p>
        <h1 className="font-heading text-3xl mt-1">Org overview</h1>
        <p className="text-ink-soft mt-1">Everything that&apos;s happening across EcoCribs Realty.</p>
      </div>

      {/* (b) KPIs — 1 col mobile / 2 sm / 4 lg */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          icon={<Wallet className="h-5 w-5" />}
          tint="green"
          label="Total pipeline"
          value={formatNGN(stats.pipelineKobo)}
          sub="Open deals across the brokerage"
        />
        <KPI
          icon={<CheckCircle2 className="h-5 w-5" />}
          tint="gold"
          label="Closed this month"
          value={String(stats.closedCount)}
          sub={stats.closedCount > 0 ? `${formatNGN(stats.closedValueKobo)} cleared` : 'No closes yet this month'}
        />
        <KPI
          icon={<Users className="h-5 w-5" />}
          tint="green"
          label="Active team"
          value="7"
          sub="1 Principal · 2 Admins · 2 Staff · 2 Agents"
        />
        <KPI
          icon={<BadgeDollarSign className="h-5 w-5" />}
          tint="orange"
          label="Commissions cleared (mo.)"
          value={formatNGN(stats.commissionsClearedKobo)}
          sub={`${stats.commissionsClearedCount} payout${stats.commissionsClearedCount === 1 ? '' : 's'}`}
        />
      </div>

      {/* (c) 2-column layout (md:grid-cols-3) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT: Admin team */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h2 className="font-heading text-xl">Admin team</h2>
              <Link
                href="/principal/admins"
                className="text-sm text-brand-green hover:underline inline-flex items-center gap-1"
              >
                Manage all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <ul className="divide-y divide-border-subtle">
              {ADMIN_ROSTER.map((a) => (
                <li
                  key={a.email}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar name={a.name} tint={a.initialsTint} />
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{a.name}</p>
                      <p className="text-xs text-ink-soft truncate">{a.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:shrink-0">
                    <RoleBadge role={a.role} />
                    <p className="text-xs text-ink-soft whitespace-nowrap">
                      Joined {relativeTime(a.joinedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* RIGHT: two stacked cards */}
        <div className="md:col-span-1 space-y-6">
          {/* Card A: Quick actions */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-heading text-xl mb-4">Quick actions</h2>
              <div className="space-y-2">
                <ActionLink
                  href="/principal/admins?invite=1"
                  icon={<UserPlus className="h-4 w-4" />}
                  label="Invite new admin"
                />
                <ActionLink
                  href="/admin"
                  icon={<ExternalLink className="h-4 w-4" />}
                  label="Open admin dashboard"
                />
                <ActionLink
                  href="/admin/commissions"
                  icon={<Wallet className="h-4 w-4" />}
                  label="Open commissions"
                />
                <ActionLink
                  href="/principal/audit"
                  icon={<ScrollText className="h-4 w-4" />}
                  label="Open audit log"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card B: This month */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-heading text-xl mb-4">This month</h2>
              <dl className="space-y-2.5">
                {monthMini.map((m) => (
                  <div key={m.label} className="flex items-baseline justify-between gap-3">
                    <dt className="text-sm text-ink-soft">{m.label}</dt>
                    <dd className="mono tabular text-sm font-medium text-ink">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* (d) Recent activity */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="font-heading text-xl mb-4">Recent activity</h2>
          <ul className="divide-y divide-border-subtle">
            {RECENT_ACTIVITY.map((a, i) => (
              <li key={i} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotColor(a.kind)}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <p className="text-sm text-ink leading-snug">{a.text}</p>
                  <p className="text-xs text-ink-soft whitespace-nowrap mt-0.5 sm:mt-0">
                    {relativeTime(a.ts)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tint: 'green' | 'gold' | 'orange';
}) {
  const t =
    tint === 'gold'
      ? 'bg-brand-gold-soft text-brand-gold'
      : tint === 'orange'
        ? 'bg-brand-orange-soft text-brand-orange'
        : 'bg-brand-green-soft text-brand-green';
  return (
    <Card>
      <CardContent className="pt-6 flex items-start gap-4">
        <span className={`grid h-10 w-10 place-items-center rounded-md ${t} shrink-0`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-2xs uppercase tracking-wider text-ink-soft font-medium">{label}</p>
          <p className="font-heading text-ink mt-1 mono tabular text-xl truncate">{value}</p>
          <p className="text-xs text-ink-soft mt-1 truncate">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Avatar({ name, tint }: { name: string; tint: 'gold' | 'green' | 'orange' }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const c =
    tint === 'gold'
      ? 'bg-brand-gold-soft text-brand-gold'
      : tint === 'orange'
        ? 'bg-brand-orange-soft text-brand-orange'
        : 'bg-brand-green-soft text-brand-green';
  return (
    <span
      className={`grid h-10 w-10 place-items-center rounded-full font-heading text-sm font-semibold shrink-0 ${c}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function RoleBadge({ role }: { role: 'Principal' | 'Admin' }) {
  if (role === 'Principal') {
    return (
      <span className="inline-flex items-center rounded-pill bg-brand-gold px-2 py-0.5 text-2xs uppercase tracking-wider font-semibold text-white">
        Principal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-pill border border-brand-green/40 bg-brand-green-soft px-2 py-0.5 text-2xs uppercase tracking-wider font-semibold text-brand-green">
      Admin
    </span>
  );
}

function ActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border border-border-subtle px-3 py-2.5 text-sm text-ink hover:bg-canvas-warm hover:border-border transition-colors"
    >
      <span className="inline-flex items-center gap-2.5 min-w-0">
        <span className="text-ink-muted shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-ink-soft shrink-0" />
    </Link>
  );
}

function dotColor(kind: ActivityKind): string {
  switch (kind) {
    case 'commission':
      return 'bg-brand-gold';
    case 'deal':
      return 'bg-brand-green';
    case 'signup':
      return 'bg-info';
    case 'system':
    default:
      return 'bg-ink-soft';
  }
}
