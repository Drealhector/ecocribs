import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server';
import { IS_PREVIEW } from '@/lib/preview';

const isProtected = createRouteMatcher(['/admin(.*)', '/agent(.*)', '/principal(.*)']);
const isSignIn = createRouteMatcher(['/sign-in']);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (IS_PREVIEW) return; // demo: no auth, no redirects

  const authed = await convexAuth.isAuthenticated();
  if (isProtected(request) && !authed) {
    return nextjsMiddlewareRedirect(request, '/sign-in');
  }
  if (isSignIn(request) && authed) {
    return nextjsMiddlewareRedirect(request, '/admin');
  }
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
