'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ArrowUpRight, Menu, X } from 'lucide-react';
import { Nav } from '@/components/design/Nav';
import { cn } from '@/lib/utils';

export function PrincipalShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const onAdmins = pathname.startsWith('/principal');

  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="p-4 border-b border-border-subtle">
        <p className="font-heading text-base text-ink leading-tight">EcoCribs Realty</p>
        <span className="inline-flex items-center mt-1.5 rounded-pill bg-brand-gold px-2 py-0.5 text-2xs uppercase tracking-wider font-semibold text-white">
          Principal
        </span>
      </div>

      <nav className="p-4 space-y-1">
        <Link
          href="/principal/admins"
          onClick={onItemClick}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
            onAdmins
              ? 'bg-brand-gold-soft text-brand-gold'
              : 'text-ink-muted hover:bg-canvas hover:text-ink',
          )}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" /> Admins
        </Link>

        <div className="pt-3 mt-3 border-t border-border-subtle">
          <Link
            href="/admin"
            onClick={onItemClick}
            className="flex items-center gap-2 rounded-md border border-brand-green/40 bg-canvas px-3 py-2.5 text-sm font-medium text-brand-green hover:bg-brand-green-soft transition-colors"
          >
            <ArrowUpRight className="h-4 w-4 shrink-0" /> Switch to admin view
          </Link>
        </div>
      </nav>
    </>
  );

  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />

      <div className="md:hidden sticky top-16 z-20 border-b border-border bg-canvas/95 backdrop-blur">
        <div className="container h-12 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">
            <span className="text-ink-soft">Principal</span>
            <span className="text-ink-soft mx-1.5">·</span>
            Admins
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
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-canvas-warm">
          <SidebarContent />
        </aside>

        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-40" style={{ height: '100dvh' }}>
            <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden />
            <aside
              className="absolute top-16 right-0 w-72 max-w-[80vw] bg-canvas-warm border-l border-border flex flex-col overflow-y-auto"
              style={{ height: 'calc(100dvh - 4rem)' }}
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
                <p className="font-heading text-base">Principal</p>
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
        )}

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
