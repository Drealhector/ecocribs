import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The progress tree.
 *
 * The PRD specifies: "Progress should feel like growth — a vertical tree or
 * vine that fills out as stages complete, rather than a sterile horizontal
 * bar." This component renders the 5 PRD stages as connected nodes on a
 * vertical vine; complete stages display a leaf glyph and the vine segment
 * below them is filled in brand green. The current stage pulses orange.
 *
 * Stages match `STAGES` in convex/lib/formatters.ts.
 */
export type StageKey = 'payment' | 'offer' | 'contract' | 'survey' | 'deed';

const STAGE_META: { key: StageKey; label: string; sublabel: string }[] = [
  { key: 'payment', label: 'Payment Confirmation', sublabel: 'Receipt issued by EcoCribs' },
  { key: 'offer', label: 'Offer Letter', sublabel: 'You review and sign' },
  { key: 'contract', label: 'Contract of Sale', sublabel: 'You and witness sign' },
  { key: 'survey', label: 'Survey Plan', sublabel: 'EcoCribs uploads endorsed plan' },
  { key: 'deed', label: 'Deed of Assignment', sublabel: 'You and witness sign' },
];

export type StageState = 'pending' | 'current' | 'complete';

export function ProgressTree({
  currentStage,
  completedStages,
  className,
}: {
  currentStage: StageKey;
  completedStages: StageKey[];
  className?: string;
}) {
  const completedSet = new Set(completedStages);
  const stageState = (k: StageKey): StageState => {
    if (completedSet.has(k)) return 'complete';
    if (k === currentStage) return 'current';
    return 'pending';
  };

  return (
    <ol className={cn('relative pl-1', className)}>
      {STAGE_META.map((s, i) => {
        const state = stageState(s.key);
        const isLast = i === STAGE_META.length - 1;
        const nextDone = !isLast && stageState(STAGE_META[i + 1]!.key) !== 'pending';

        return (
          <li key={s.key} className="relative pb-8 last:pb-0 pl-12">
            {/* The vine segment connecting this node to the next */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[19px] top-10 bottom-0 w-[2px] origin-top',
                  state === 'complete' && nextDone
                    ? 'bg-brand-green'
                    : state === 'complete'
                      ? 'bg-gradient-to-b from-brand-green to-brand-green/30'
                      : 'bg-border',
                )}
              />
            )}

            {/* Stage node */}
            <span
              aria-hidden
              className={cn(
                'absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full border-2 shadow-soft',
                state === 'complete'
                  ? 'bg-brand-green border-brand-green text-white'
                  : state === 'current'
                    ? 'bg-brand-orange-soft border-brand-orange text-brand-orange'
                    : 'bg-canvas border-border text-ink-soft',
              )}
            >
              {state === 'complete' ? (
                <Check className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <Leaf className={cn('h-5 w-5', state === 'current' && 'text-brand-orange')} />
              )}
            </span>

            <div className="pt-1">
              <p
                className={cn(
                  'font-heading font-medium leading-tight',
                  state === 'pending' ? 'text-ink-soft' : 'text-ink',
                )}
              >
                {s.label}
              </p>
              <p className="text-sm text-ink-soft mt-0.5">{s.sublabel}</p>
              {state === 'current' && (
                <p className="mt-2 text-xs font-medium text-brand-orange uppercase tracking-wider">
                  In progress
                </p>
              )}
              {state === 'complete' && (
                <p className="mt-2 text-xs font-medium text-brand-green uppercase tracking-wider">
                  Complete
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M11 20A7 7 0 0 1 4 13c0-5.5 4-9 13-11 0 7-3 13-11 14 0 0-1 .5-1 4" />
      <path d="M11 20c2-3 4-7 4-10" />
    </svg>
  );
}
