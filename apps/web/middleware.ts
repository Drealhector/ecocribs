import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const IS_PREVIEW =
  process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true' ||
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * In production this middleware uses `clerkMiddleware()` to gate `/admin/*`.
 * In preview mode we skip auth entirely so reviewers can click through the
 * full design without signing up for Clerk.
 */
export default async function middleware(_req: NextRequest) {
  if (IS_PREVIEW) return NextResponse.next();

  // Lazy-load Clerk only when not in preview.
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  const isAdmin = createRouteMatcher(['/admin(.*)']);
  const handler = clerkMiddleware(async (auth, req) => {
    if (isAdmin(req)) await auth.protect();
  });
  return handler(_req, {} as any);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
