/**
 * Convex ↔ Clerk JWT auth bridge.
 *
 * Configure Clerk: Backend → JWT Templates → New template named "convex"
 * with issuer = your Clerk Frontend API URL. Convex validates the JWT using
 * the `applicationID` claim, which Clerk auto-populates.
 */
export default {
  providers: [
    {
      domain: process.env.NEXT_PUBLIC_CLERK_DOMAIN ?? process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
};
