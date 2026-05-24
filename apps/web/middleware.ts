import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';

const IS_PREVIEW =
  process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true' ||
  !process.env.NEXT_PUBLIC_CONVEX_URL;

const isAdmin = createRouteMatcher(['/admin(.*)']);
const isSignIn = createRouteMatcher(['/sign-in']);

/**
 * Convex Auth middleware gates `/admin/*` behind an authenticated user
 * session and bounces already-signed-in users away from `/sign-in`.
 *
 * Witness routes (`/w/[token]`) and client deal routes (`/d/[dealId]`) are
 * intentionally NOT protected here — they use participant sessions enforced
 * server-side, not Convex Auth user sessions.
 *
 * In preview mode we short-circuit so reviewers can click through the full
 * design without a Convex deployment or sign-up.
 */
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (IS_PREVIEW) return; // preview mode: no auth, no redirects

  const authed = await convexAuth.isAuthenticated();
  if (isAdmin(request) && !authed) {
    return nextjsMiddlewareRedirect(request, '/sign-in');
  }
  if (isSignIn(request) && authed) {
    return nextjsMiddlewareRedirect(request, '/admin');
  }
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
