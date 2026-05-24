'use client';

import type { ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { IS_PREVIEW } from '@/lib/preview';

/**
 * In production:
 *   <ClerkProvider> wraps <ConvexProviderWithClerk> wraps app.
 * In preview mode (no Clerk publishable key): ConvexProvider with a stub
 * client is mounted so `useQuery` calls compile; pages pass `'skip'` so
 * no network requests fire.
 *
 * To go live, set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY +
 * NEXT_PUBLIC_CONVEX_URL, and remove NEXT_PUBLIC_PREVIEW_MODE.
 */
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || 'https://preview.convex.cloud',
);

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  if (IS_PREVIEW) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  // Lazy-import the real Clerk wiring so we don't load it in preview.
  const { ClerkProvider, useAuth } = require('@clerk/nextjs');
  const { ConvexProviderWithClerk } = require('convex/react-clerk');
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#F3860D',
          colorBackground: '#FFFFFF',
          colorText: '#111111',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-lato), Lato, system-ui, sans-serif',
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
