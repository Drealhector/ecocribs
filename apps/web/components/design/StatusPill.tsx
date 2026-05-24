import { cn } from '@/lib/utils';

/**
 * Status pill — chrome surrounding every state label.
 *
 *   Pending / Awaiting EcoCribs  → warm gold
 *   Awaiting Client / Witness    → orange
 *   Signed / Receipt Issued      → green
 *   Completed                    → deep green
 *   Declined                     → danger
 *   Archived                     → neutral
 */
const TONE: Record<string, string> = {
  pending: 'bg-brand-gold-soft text-brand-gold border-brand-gold/30',
  action: 'bg-brand-orange-soft text-brand-orange border-brand-orange/30',
  progress: 'bg-brand-green-soft text-brand-green border-brand-green/30',
  done: 'bg-brand-green text-white border-brand-green',
  danger: 'bg-red-50 text-danger border-danger/30',
  neutral: 'bg-canvas-warm text-ink-soft border-border',
};

const DOT: Record<keyof typeof TONE, string> = {
  pending: 'bg-brand-gold',
  action: 'bg-brand-orange',
  progress: 'bg-brand-green',
  done: 'bg-white',
  danger: 'bg-danger',
  neutral: 'bg-ink-soft',
};

function toneFor(label: string): keyof typeof TONE {
  const l = label.toLowerCase();
  if (l.includes('completed')) return 'done';
  if (l.includes('declined')) return 'danger';
  if (l.includes('archived')) return 'neutral';
  if (l.includes('awaiting ecocribs') || l.includes('pending')) return 'pending';
  if (l.includes('awaiting')) return 'action';
  if (l.includes('signed') || l.includes('issued')) return 'progress';
  return 'neutral';
}

export function StatusPill({ label, className }: { label: string; className?: string }) {
  const t = toneFor(label);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-medium tracking-wide whitespace-nowrap',
        TONE[t],
        className,
      )}
    >
      <span className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full', DOT[t])} />
      {label}
    </span>
  );
}
