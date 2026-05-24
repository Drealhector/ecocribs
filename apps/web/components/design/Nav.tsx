'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Logo } from './Logo';
import { Button } from './Button';
import { IS_PREVIEW } from '@/lib/preview';

const ClerkBits = dynamic(() => import('./NavClerkBits').then((m) => m.NavClerkBits), {
  ssr: false,
  loading: () => null,
});

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="flex items-center gap-3">
          {IS_PREVIEW ? (
            <>
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-pill bg-brand-gold-soft px-3 py-1 text-2xs font-medium uppercase tracking-wider text-brand-gold">
                Preview mode · seed data
              </span>
              <Link
                href="/admin"
                className="hidden md:inline-flex text-sm font-medium text-ink-muted hover:text-ink transition-colors px-3 py-2"
              >
                Admin
              </Link>
              <Button asChild variant="primary" size="sm">
                <Link href="/customer-sign-in">Customer sign-in</Link>
              </Button>
            </>
          ) : (
            <ClerkBits />
          )}
        </div>
      </div>
    </header>
  );
}
