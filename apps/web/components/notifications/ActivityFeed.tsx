import { Bell, FileSignature, FileText, Send, AlertCircle } from 'lucide-react';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type Event = {
  _id: string;
  action: string;
  at: number;
  metadata?: Record<string, unknown>;
  actorRole: string;
};

const ICON: Record<string, { icon: typeof Bell; tone: string }> = {
  'deal.create': { icon: FileText, tone: 'text-brand-green bg-brand-green-soft' },
  'deal.transition': { icon: Send, tone: 'text-brand-orange bg-brand-orange-soft' },
  'deal.override': { icon: AlertCircle, tone: 'text-danger bg-red-50' },
  'doc.sign': { icon: FileSignature, tone: 'text-brand-green bg-brand-green-soft' },
  'doc.send': { icon: Send, tone: 'text-brand-orange bg-brand-orange-soft' },
  'doc.upload': { icon: FileText, tone: 'text-brand-green bg-brand-green-soft' },
};

function describe(e: Event): string {
  const meta = (e.metadata ?? {}) as Record<string, string>;
  switch (e.action) {
    case 'deal.create': return 'Deal created';
    case 'deal.transition': return `Status updated: ${meta.from} → ${meta.to}`;
    case 'deal.override': return `Manager override: ${meta.from} → ${meta.to}`;
    case 'doc.sign': return 'Document signed';
    case 'doc.send': return 'Document sent';
    case 'doc.upload': return 'Document uploaded';
    case 'invite.create': return 'Invitation sent';
    case 'invite.accept': return 'Invitation accepted';
    case 'auth.login': return 'Signed in';
    default: return e.action;
  }
}

export function ActivityFeed({ events, className }: { events: Event[]; className?: string }) {
  if (events.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-canvas-warm p-6 text-center text-sm text-ink-soft', className)}>
        No activity yet on this deal.
      </div>
    );
  }

  return (
    <ul className={cn('space-y-3', className)}>
      {events.map((e) => {
        const meta = ICON[e.action] ?? { icon: Bell, tone: 'text-ink-soft bg-canvas-warm' };
        const Icon = meta.icon;
        return (
          <li key={e._id} className="flex items-start gap-3 rounded-md border border-border-subtle bg-canvas p-3">
            <span className={cn('grid h-8 w-8 place-items-center rounded-full shrink-0', meta.tone)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{describe(e)}</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {e.actorRole} · <span className="tabular">{relativeTime(e.at)}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
