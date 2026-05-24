# Deploy to Vercel

Step-by-step runbook for shipping the EcoCribs Documentation Portal to production on Vercel.

## Prerequisites

- Convex production deployment exists (`npx convex deploy --prod` has been run from `convex/`)
- GitHub repo is pushed and accessible to the Vercel team
- Domain `portal.ecocribsrealty.com` DNS is reachable (CNAME ready or pending)
- Vercel CLI installed locally: `pnpm dlx vercel --version`

## Step 1 — Connect Vercel to repo

1. Vercel dashboard → **Add New… → Project** → import the GitHub repo.
2. **Root directory:** leave at repo root (`./`) — `vercel.json` handles the monorepo wiring.
3. **Framework preset:** Next.js (auto-detected from `vercel.json`).
4. Do **not** override Build/Install commands — `vercel.json` already sets them to `pnpm --filter web build` and `pnpm install --frozen-lockfile`.

## Step 2 — Set environment variables

Open **Project Settings → Environment Variables** and add every key from `apps/web/.env.production.example`. Apply to **Production** (and **Preview** if you want PR previews).

Critical first-deploy keys:

- `NEXT_PUBLIC_CONVEX_URL` — from `npx convex deploy --prod` output
- `CONVEX_DEPLOYMENT` — same source
- `SITE_URL` — `https://portal.ecocribsrealty.com`
- `JWT_PRIVATE_KEY`, `JWKS` — from `npx convex auth init` (or pre-generated)
- `NEXT_PUBLIC_APP_URL` — `https://portal.ecocribsrealty.com`

Phase-2 keys (Twilio, Resend, R2, Smile) can stay blank until those flows are wired.

## Step 3 — Trigger first deploy

```
git push origin main
```

Or from the Vercel dashboard: **Deployments → Redeploy**. Region is pinned to `fra1` (Frankfurt) — lowest latency to Lagos on the free tier.

## Step 4 — Verify with curl

After build completes, probe the three primary surfaces. Expect `200` (or `307` redirects for auth-gated routes):

```
curl -I https://<deploy-url>/
curl -I https://<deploy-url>/admin
curl -I https://<deploy-url>/d/test
```

Also confirm security headers are present:

```
curl -sI https://<deploy-url>/ | grep -iE 'x-frame|x-content|referrer'
```

## Step 5 — Set custom domain

1. **Project Settings → Domains → Add** → `portal.ecocribsrealty.com`.
2. Add the CNAME record Vercel prints at the DNS provider (`cname.vercel-dns.com`).
3. Wait for SSL provisioning (usually under 5 min).
4. Re-run the Step 4 curl probes against `https://portal.ecocribsrealty.com`.

## Rollback

If a deploy breaks production:

1. **Deployments** tab → find the last known-good deployment.
2. Click `…` → **Promote to Production**. Takes ~10 seconds; no rebuild.
3. Confirm with `curl -I https://portal.ecocribsrealty.com/`.
4. Open an incident note, then `git revert` the offending commit on `main` so the next deploy doesn't re-break things.

For Convex schema regressions, also run `npx convex deploy --prod` against the previous Convex git ref.
