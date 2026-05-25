import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';

/**
 * Demo mode — hardcoded to match lib/preview.ts. Skips ALL auth checks
 * so the user can browse every section (admin, agent, customer, witness,
 * sign pages) freely without logging in.
 *
 * Flip to `false` to re-enable real Convex Auth gating on /admin and the
 * /sign-in redirect-when-already-authed behaviour.
 */
const IS_PREVIEW = true;

const isAdmin = createRouteMatcher(['/admin(.*)', '/agent(.*)']);
const isSignIn = createRouteMatcher(['/sign-in']);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (IS_PREVIEW) return; // demo: no auth, no redirects

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
