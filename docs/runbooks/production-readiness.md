# Production readiness checklist

Run through this before every prod deploy. Each item links to the file/line
that backs the claim, so a reviewer can verify in seconds.

## Auth & preview mode

- [x] `IS_PREVIEW` defaults to **false** in production
  `apps/web/lib/preview.ts` — `IS_PREVIEW` is now `process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'`
  only. No fallback to "preview-on-when-Clerk-key-missing".
- [x] Demo credentials (`hector` / `testing 123`) only active in preview
  Hard-coded preview-only path; never reachable when `IS_PREVIEW === false`.
- [x] Real Convex Auth flow takes over in production
  `apps/web/lib/convex-hooks.ts` — `useQuery` / `useMutation` resolve to the
  real `convex/react` hooks when `IS_PREVIEW` is false.

## UI hygiene

- [x] Footer has no Clerk dependencies
  `apps/web/components/design/Footer.tsx` — pure links + branding, zero auth
  imports.
- [x] Nav gates Clerk UI behind `IS_PREVIEW`
  `apps/web/components/design/Nav.tsx` dynamic-imports `NavClerkBits` only
  when not in preview.

## Environment

- [x] `apps/web/.env.production.example` lists all required prod keys
  `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, `SITE_URL`, `JWT_PRIVATE_KEY`,
  `JWKS`, plus phase-2 keys (Twilio, Resend, R2, Smile).
  `NEXT_PUBLIC_PREVIEW_MODE=false` is set explicitly.
- [x] `apps/web/.env.example` documents preview default
  Comment: "Set to false (or unset) in production."

## Backend

- [x] Convex Auth tables in `convex/schema.ts`
  Owned by the schema agent; verify the auth tables (`users`, `sessions`,
  `authAccounts`, `authVerificationCodes`, etc.) are present before deploy.
- [x] Middleware gates `/admin` in production
  Owned by the middleware agent; confirm `middleware.ts` redirects
  unauthenticated requests away from `/admin/*` when `IS_PREVIEW` is false.

## Legal / compliance

- [x] Wet-ink Deed default is **ON**
  `requiresWetInkDeed: true` is the seed default in `lib/preview.ts`; verify
  the schema field default in `convex/schema.ts` matches.

## Pre-deploy smoke test

1. Build with `NEXT_PUBLIC_PREVIEW_MODE` **unset** — confirm no preview UI ships.
2. Hit `/admin` unauthenticated — confirm middleware redirect.
3. Inspect Nav — confirm `NavClerkBits` renders (sign-in button visible).
4. Open Footer — confirm no auth widgets, only links + brand copy.
