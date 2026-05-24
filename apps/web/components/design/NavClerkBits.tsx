'use client';

import Link from 'next/link';
import { UserButton, SignedIn, SignedOut, OrganizationSwitcher } from '@clerk/nextjs';
import { Button } from './Button';

export function NavClerkBits() {
  return (
    <>
      <SignedIn>
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            elements: {
              rootBox: 'mr-1',
              organizationSwitcherTrigger: 'rounded-md border border-border px-2 py-1',
            },
          }}
        />
        <Link
          href="/admin"
          className="hidden md:inline-flex text-sm font-medium text-ink-muted hover:text-ink transition-colors px-3 py-2"
        >
          Dashboard
        </Link>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">Staff sign-in</Link>
        </Button>
      </SignedOut>
    </>
  );
}
