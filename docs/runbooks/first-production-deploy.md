# First Production Deploy — EcoCribs Portal

Ship from fresh clone to `https://portal.ecocribsrealty.com`. Assumes Node 24, pnpm 11, npm 11, PowerShell, repo at `C:\Users\samym\ecocribs-portal`.

---

## 1. Convex — first deploy

```powershell
cd C:\Users\samym\ecocribs-portal
pnpm install
npx convex login                       # opens browser
npx convex dev --once --configure=new  # pick team -> name project "ecocribs-portal"
```

`--configure=new` provisions a fresh dev deployment and writes `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` to `.env.local`; `--once` exits after one push. Expected tail: `Convex functions ready! https://<slug>.convex.cloud`.

Promote to production (creates prod under the same project):

```powershell
npx convex deploy
```

### Convex Auth env vars (set on PROD deployment)

Three vars required: `SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`. The helper CLI generates the RS256 keypair, sets all three on dev + prod, and writes `convex/auth.config.ts`:

```powershell
npx @convex-dev/auth
```

Manual fallback (`https://labs.convex.dev/auth/setup/manual`): run the `jose`-based `generateKeys.mjs` from the docs, then:

```powershell
npx convex env set SITE_URL https://portal.ecocribsrealty.com --prod
npx convex env set JWT_PRIVATE_KEY --from-file .\jwt_private_key.pem --prod
npx convex env set JWKS --from-file .\jwks.json --prod
npx convex env list --prod   # verify all three present
```

`SITE_URL` is the **frontend** origin (not the Convex URL). Update after step 3 once the domain is live.

---

## 2. Vercel — first deploy

```powershell
npm i -g vercel
vercel login                 # browser auth
vercel link --yes            # links cwd to a new project, accepts defaults
```

### Required env vars (set BEFORE `vercel deploy --prod`)

The build runs `npx convex deploy --cmd 'npm run build'`, which needs the Convex deploy key:

```powershell
# Generate prod deploy key in Convex dashboard: Settings -> Deploy Keys -> Generate Production
echo "<paste-key>" | vercel env add CONVEX_DEPLOY_KEY production
echo "https://<slug>.convex.cloud" | vercel env add NEXT_PUBLIC_CONVEX_URL production
```

`CONVEX_DEPLOY_KEY` lets the Vercel build push functions and inject `CONVEX_URL`. `NEXT_PUBLIC_CONVEX_URL` is what the client SDK reads at runtime.

Confirm the build command in **Vercel Project Settings → Build & Development**:

```
npx convex deploy --cmd 'npm run build'
```

Then ship:

```powershell
vercel deploy --prod
```

Expected output ends with `https://ecocribs-portal-<hash>.vercel.app`.

---

## 3. Custom domain — `portal.ecocribsrealty.com`

```powershell
vercel domains add portal.ecocribsrealty.com ecocribs-portal
```

Vercel prints the DNS target. Add **one** of these records at your registrar (whoever hosts `ecocribsrealty.com` DNS):

| Type   | Name     | Value                   | TTL  |
|--------|----------|-------------------------|------|
| CNAME  | portal   | `cname.vercel-dns.com`  | 3600 |

(If your DNS provider doesn't allow CNAME flattening at the apex, use the A record Vercel shows — typically `76.76.21.21` — but for a subdomain CNAME is correct.)

Verify propagation and SSL:

```powershell
vercel domains inspect portal.ecocribsrealty.com
nslookup portal.ecocribsrealty.com
```

Once `Status: Valid Configuration` appears, update `SITE_URL` on Convex prod (see step 1) and redeploy: `vercel deploy --prod`.

---

## 4. Verification probe

Run after the cert is issued (usually 1–5 min after DNS resolves):

```powershell
$base = "https://portal.ecocribsrealty.com"
"/", "/sign-in", "/customer-sign-in", "/admin" | ForEach-Object {
  $url = "$base$_"
  try {
    $r = Invoke-WebRequest -Uri $url -MaximumRedirection 0 -SkipHttpErrorCheck -UseBasicParsing
    $ok = @(200, 307, 308) -contains $r.StatusCode
    "{0,-25} {1} {2}" -f $_, $r.StatusCode, $(if ($ok) {"OK"} else {"FAIL"})
  } catch {
    "{0,-25} ERR {1}" -f $_, $_.Exception.Message
  }
}
```

Expected: all four print `OK`. `/admin` redirecting to `/sign-in` returns 307 — that's healthy.

---

## 5. First admin user

After UI is live:

1. Visit `https://portal.ecocribsrealty.com/sign-in` and complete signup (this creates the Convex Auth `users` row).
2. Promote yourself to admin from the repo root:

```powershell
npx convex run seed:seedFirstAdmin --prod
```

`seedFirstAdmin` (in `convex/seed.ts`) finds the single existing user and attaches the admin membership. It refuses to run if more than one user already exists — that's the safety rail. After it succeeds, hard-refresh `/admin`.

Alternate UI path: if `convex/seed.ts` exports a `firstRunCheck` query, the `/admin` page renders a "Claim as admin" CTA when zero admins exist. Click it once; subsequent visits 404 the CTA.

---

## 6. Rollback

**Code:**

```powershell
git revert <bad-sha>
git push origin main         # Vercel auto-deploys the revert
```

**Instant Vercel rollback (no rebuild):**

```powershell
vercel rollback              # interactive picker of recent prod deploys
# or target a specific one:
vercel rollback https://ecocribs-portal-abc123.vercel.app
vercel rollback status       # confirm promotion completed
```

**Convex functions** do not roll back with Vercel — they're a separate deployment. To revert backend logic, check out the previous commit and run `npx convex deploy` from that tree.

---

## Troubleshooting

- `convex deploy` fails with `No deployment URL` in Vercel build → `CONVEX_DEPLOY_KEY` is missing or set to a dev key. Regenerate a **Production** key.
- `JWT verification failed` after first login → `SITE_URL` on Convex prod doesn't match the browser origin. Update and redeploy.
- DNS shows `Invalid Configuration` after 10 min → CNAME points to the wrong target or registrar added a trailing dot. Delete and recreate.
- `vercel link --yes` picks wrong scope → run `vercel switch` first.
