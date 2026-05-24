'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, FilePlus, ScrollText, Menu, X } from 'lucide-react';
import { Nav } from '@/components/design/Nav';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview', match: (p: string) => p === '/admin' },
  { href: '/admin/deals', icon: FileText, label: 'Deals', match: (p: string) => p.startsWith('/admin/deals') },
  { href: '/admin/templates', icon: FilePlus, label: 'Templates', match: (p: string) => p.startsWith('/admin/templates') },
  { href: '/admin/users', icon: Users, label: 'Team', match: (p: string) => p.startsWith('/admin/users') },
  { href: '/admin/audit', icon: ScrollText, label: 'Audit log', match: (p: string) => p.startsWith('/admin/audit') },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <nav className="p-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label, match }) => (
          <Link
            key={href}
            href={href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              match(pathname)
                ? 'bg-brand-orange-soft text-brand-orange'
                : 'text-ink-muted hover:bg-canvas hover:text-ink',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 text-2xs text-ink-soft border-t border-border-subtle">
        <p className="mono uppercase tracking-wider mb-1">Compliance</p>
        <p>SCUML reg required before launch.</p>
        <p className="mt-1">Deed of Assignment defaults to wet-ink hybrid.</p>
      </div>
    </>
  );

  const activeLabel = NAV_ITEMS.find((i) => i.match(pathname))?.label ?? 'Overview';

  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />

      {/* Mobile sub-nav bar with hamburger to open drawer */}
      <div className="md:hidden sticky top-16 z-20 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="container h-12 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">
            <span className="text-ink-soft">Admin</span>
            <span className="text-ink-soft mx-1.5">·</span>
            {activeLabel}
          </p>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 px-3 items-center gap-1.5 rounded-md border border-border text-sm text-ink-muted hover:bg-canvas-warm"
          >
            <Menu className="h-4 w-4" /> Menu
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-canvas-warm">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        <div
          className={cn(
            'md:hidden fixed inset-0 z-30 transition-opacity duration-200',
            drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className={cn(
              'absolute top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-canvas-warm border-l border-border flex flex-col transition-transform duration-200',
              drawerOpen ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-border">
              <p className="font-heading text-base">Admin</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onItemClick={() => setDrawerOpen(false)} />
          </aside>
        </div>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
