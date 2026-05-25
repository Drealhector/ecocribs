'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IS_PREVIEW } from '@/lib/preview';

/**
 * Floating "jump to any section" navigator — visible only in demo mode.
 * Sits bottom-right, opens a panel listing every meaningful URL in the
 * app grouped by audience. Lets the user explore all surfaces without
 * memorising paths or logging in.
 */
const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Customer',
    links: [
      { href: '/', label: 'Public landing' },
      { href: '/customer-sign-in', label: 'Customer sign in' },
      { href: '/accept-invite?t=demo', label: 'Accept invite (one tap)' },
      { href: '/d/deal_demo_001', label: 'Portal · Adaeze (mid-flow)' },
      { href: '/d/deal_demo_002', label: 'Portal · Ifeanyi (late stage)' },
      { href: '/d/deal_demo_003', label: 'Portal · Tolulope (early)' },
      { href: '/d/deal_demo_004', label: 'Portal · Chinwe (completed)' },
      { href: '/d/deal_demo_005', label: 'Portal · Olamide (just paid)' },
      { href: '/d/deal_demo_001/sign/deal_demo_001_contract', label: 'Sign a document' },
    ],
  },
  {
    title: 'Agent',
    links: [
      { href: '/become-an-agent', label: 'Public agent signup' },
      { href: '/agent', label: 'Agent dashboard' },
    ],
  },
  {
    title: 'Staff / Admin',
    links: [
      { href: '/sign-in', label: 'Staff sign in' },
      { href: '/admin', label: 'Admin overview' },
      { href: '/admin/deals', label: 'All deals' },
      { href: '/admin/deals/deal_demo_001', label: 'Deal detail' },
      { href: '/admin/deals/new', label: 'Onboard customer' },
      { href: '/admin/commissions', label: 'Commission ledger' },
      { href: '/admin/templates', label: 'PDF templates' },
      { href: '/admin/users', label: 'Team + invite' },
      { href: '/admin/audit', label: 'Activity log' },
    ],
  },
  {
    title: 'Witness / Other',
    links: [
      { href: '/w/demo-witness-token', label: 'Witness gate' },
      { href: '/team-join?t=demo', label: 'Team join (invitee)' },
    ],
  },
];

export function DemoNavigator() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Only show in demo mode
  if (!IS_PREVIEW) return null;

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Open demo navigator"
        className={cn(
          'fixed bottom-4 right-4 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-brand-orange px-4 text-white text-sm font-medium shadow-lift hover:bg-brand-orange-hover transition-colors',
          open && 'opacity-0 pointer-events-none',
        )}
      >
        <Compass className="h-5 w-5" />
        <span className="hidden sm:inline">Jump to section</span>
      </button>

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed bottom-4 right-4 z-50 w-[90vw] max-w-sm bg-canvas rounded-lg shadow-lift border border-border transition-all',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="font-heading font-medium text-ink">Demo navigator</p>
            <p className="text-2xs text-ink-soft">Jump straight to any section — no login</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-canvas-warm hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-2 py-2">
          {SECTIONS.map((s) => (
            <div key={s.title} className="mb-3 last:mb-1">
              <p className="px-3 py-1 text-2xs uppercase tracking-wider font-medium text-ink-soft">
                {s.title}
              </p>
              <ul>
                {s.links.map((l) => {
                  const isCurrent = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href.split('?')[0]!));
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                          isCurrent
                            ? 'bg-brand-orange-soft text-brand-orange font-medium'
                            : 'text-ink-muted hover:bg-canvas-warm hover:text-ink',
                        )}
                      >
                        <span className="truncate">{l.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border-subtle px-4 py-2 text-2xs text-ink-soft text-center">
          Demo mode · no auth · seed data
        </div>
      </div>
    </>
  );
}
