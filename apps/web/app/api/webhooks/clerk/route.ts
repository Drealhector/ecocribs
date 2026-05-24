/**
 * Clerk webhook is handled inside Convex directly (see `convex/http.ts`).
 * Configure Clerk to POST to:
 *   https://<your-convex-deployment>.convex.site/webhooks/clerk
 *
 * This Next.js route is a thin guard for cases where Clerk insists on a
 * domain it controls. In production, point Clerk straight at Convex.
 */
export async function POST() {
  return new Response(
    'Configure Clerk webhook to point to /webhooks/clerk on your Convex deployment instead.',
    { status: 410 },
  );
}
