'use client';

import type { ReactNode } from 'react';
import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs';
import { ConvexReactClient } from 'convex/react';
import { IS_PREVIEW } from '@/lib/preview';

/**
 * Auth provider tree.
 *
 * In production: <ConvexAuthNextjsProvider> wires Convex Auth session state
 * into the Convex client so `useQuery` / `useMutation` see the authed identity.
 *
 * In preview mode (no Convex backend): short-circuit and render children
 * directly. Pages pass `'skip'` to useQuery so no network requests fire.
 *
 * Note: the file name / export is kept as `ConvexClerkProvider` to avoid
 * churning every importer in the same migration. Internally it's Convex Auth.
 */
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || 'https://preview.convex.cloud',
);

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  if (IS_PREVIEW) {
    // Preview keeps demo-data flow alive; no auth needed.
    return <>{children}</>;
  }
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
