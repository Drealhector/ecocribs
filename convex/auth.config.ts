/**
 * Convex Auth JWT provider configuration.
 *
 * Convex Auth manages its own JWT issuance and signing — we just point Convex
 * at the deployment's own site URL as the issuer. Per the Convex Auth docs,
 * the `applicationID` claim is always "convex".
 *
 * See: https://labs.convex.dev/auth
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: 'convex',
    },
  ],
};
