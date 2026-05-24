'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './Button';

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="shrink-0 -my-2" aria-label="EcoCribs home">
          <Logo compact />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/admin"
            className="text-sm font-medium text-ink-muted hover:text-ink transition-colors px-3 py-2"
          >
            Admin
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Staff sign-in</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/customer-sign-in">Customer sign-in</Link>
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-canvas-warm hover:text-ink transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer — only mounted when open (no SSR/transform purge issues) */}
      {open && (
        <div
          className="md:hidden fixed inset-x-0 top-16 bg-canvas border-t border-border z-30 overflow-y-auto animate-fade-in"
          style={{ height: 'calc(100dvh - 4rem)' }}
        >
          <div className="container py-6 flex flex-col gap-1">
            <Link
              href="/admin"
              className="flex items-center justify-between rounded-md px-4 py-4 text-base font-medium text-ink hover:bg-canvas-warm"
            >
              Admin dashboard
              <span aria-hidden className="text-ink-soft">›</span>
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center justify-between rounded-md px-4 py-4 text-base font-medium text-ink hover:bg-canvas-warm"
            >
              Staff sign-in
              <span aria-hidden className="text-ink-soft">›</span>
            </Link>
            <Link
              href="/accept-invite"
              className="flex items-center justify-between rounded-md px-4 py-4 text-base font-medium text-ink hover:bg-canvas-warm"
            >
              I have an invite
              <span aria-hidden className="text-ink-soft">›</span>
            </Link>
            <div className="mt-4 px-1">
              <Button asChild size="lg" className="w-full">
                <Link href="/customer-sign-in">Customer sign-in</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
