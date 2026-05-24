# Auth Migration Security Review

Post-deploy checklist for the Clerk -> Convex Auth migration. Run after any push touching `convex/auth.ts`, `convex/lib/withAuth.ts`, `convex/lib/authz.ts`, `convex/invitations.ts`, or `convex/http.ts`. Each item is verifiable in under 5 minutes.

## 1. Identity & sessions

- [ ] **Hash algorithm.** `convex/auth.ts` imports Password from `@convex-dev/auth/providers/Password` (scrypt by default). Reject any custom `hash`/`verify` that swaps to bcrypt/sha.
- [ ] **Cookie flags.** Sign in; DevTools -> Application -> Cookies on `__session`/`auth-*`: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`. Missing any = blocker.
- [ ] **Session TTL.** Convex Auth defaults: 30d session, 1h JWT refresh. Confirm no override in `convex/auth.ts` raises beyond 30d.
- [ ] **Logout-all-devices.** A server path deletes all rows in `authSessions` for the user. If absent, file follow-up.
- [ ] **MFA.** Password provider has no TOTP. Confirm Phase 2 noted in `docs/architecture/` and admins flagged for early enrollment.
- [ ] **Clerk JWT retired.** `Grep` for `clerkId`, `useUser`, `@clerk/`, `CLERK_JWT_ISSUER_DOMAIN` outside `convex/webhooks/clerk.ts` and `convex/http.ts:14-71`. Any hit in business code = stale wiring.

## 2. Authorization (data layer)

- [ ] **withAuth chokepoint.** `Grep` `^export const \w+ = (query|mutation|action)\(` across `convex/`. Each hit must be `internal*`, an auth endpoint, or `acceptInvite` (`convex/invitations.ts:182`). Else: unauthenticated public endpoint.
- [ ] **404-not-403.** `readDeal` (`convex/lib/authz.ts:55-68`) and `readDocument` (`:70-84`) throw `NOT_FOUND` cross-org. Confirm no caller rewrites to `FORBIDDEN`.
- [ ] **State machine server-side.** `Grep` `db.patch.*state:` in `convex/deals.ts`. Every match must be preceded by `assertValidTransition` (`convex/lib/authz.ts:108`).
- [ ] **Audit write-only.** `Grep` `'audit_logs'` across `convex/`. Only `convex/lib/audit.ts:86` may `.insert`; zero `.patch`/`.replace`/`.delete`.
- [ ] **Role re-read live.** `convex/lib/withAuth.ts:31-37` reads `memberships` each call; no token-claim shortcut added.

## 3. External participant flow

- [ ] **Token hashed at rest.** `convex/invitations.ts:31` calls `hashToken` before `_persistInvite`. Schema has `tokenHash`, never `token`.
- [ ] **PIN salted with token.** `convex/lib/tokens.ts:46-48`: `sha256(pin + '|' + token)`. Confirm `hashPin` never called with empty/constant salt.
- [ ] **Constant-time compare.** `convex/invitations.ts:197` uses `constantTimeEqual` (`convex/lib/tokens.ts:54-59`). No `===`/`!=` PIN/token compares elsewhere.
- [ ] **Single-use atomic.** `convex/invitations.ts:201-202` patches `usedAt` within the same mutation -> atomic. No out-of-band marker used instead.
- [ ] **TTL bounds.** `convex/invitations.ts:9-10`: client 72h, witness 7d. Unchanged; any extension needs sign-off.
- [ ] **Revocation honored.** `:193` rejects on `revokedAt`. Admin `revokeInvite` mutation exists and writes `invite.revoke` audit row.

## 4. IDOR / object-level auth

- [ ] **Readers everywhere.** `Grep` `apps/web/` for `useQuery(api.deals.` and `useQuery(api.documents.`. Each underlying handler calls `readDeal`/`readDocument`.
- [ ] **Cross-org probe.** Staging console: `await convex.query(api.deals.get, { id: '<other-org-deal>' })` -> `NOT_FOUND`. Never returns data or `FORBIDDEN`.
- [ ] **Agent-scope probe.** Sign in as `agent` not on `assignedAgentIds`; query a valid same-org deal -> `NOT_FOUND` (`convex/lib/authz.ts:64-66`).
- [ ] **No raw URLs in emails.** `convex/notifications/dispatch.ts` links to `/deals/:id`, never raw R2/storage URLs. Inspect a delivered email's HTML.
- [ ] **Re-auth on download.** `Grep` `getUrl`/`storage.getUrl` in `convex/`. Every call site preceded by `readDocument`.

## 5. Compliance posture

- [ ] **Hash-chain verifier.** `convex/lib/audit.ts:76-86` writes `hashChain`. A cron in `convex/crons.ts` recomputes and alerts on divergence.
- [ ] **7-year retention.** No cron deletes `audit_logs`; any pruner cutoff >= 2557 days.
- [ ] **Per-recipient watermark.** `convex/documents/generate.ts` embeds recipient name + timestamp + invite id in PDF footer. Spot-check one sample.
- [ ] **NDPA breach runbook.** `docs/runbooks/ndpa-breach-72h.md` exists with 72h template and NDPC contact. If missing, blocker.
- [ ] **SCUML + DPO documented.** `docs/architecture/compliance.md` names SCUML (EFCC) as a launch gate and lists the appointed DPO with NDPC-registered email.

## 6. Pre-launch gates

- [ ] **SCUML certificate filed.** Certificate or filing receipt under `docs/compliance/scuml/`; EFCC portal status checked within 30d.
- [ ] **DPCO engaged.** NDPC-licensed DPCO on retainer; engagement letter on file.
- [ ] **WhatsApp templates approved.** All `invite.*`/`reminder.*` templates in `convex/notifications/dispatch.ts` show APPROVED in Meta Business Manager (not PENDING/REJECTED).
- [ ] **Legal sign-off.** Each PDF template in `convex/documents/generate.ts` has a counsel sign-off note in `docs/compliance/legal-signoff.md` with name + date.
- [ ] **Pen-test scheduled.** SoW explicitly covers IDOR (Section 4) and token replay (Section 3). Date: ____.
- [ ] **Prod smoke.** Post-deploy: create test deal, invite test client, accept, sign one document, verify audit chain valid. Tear down test data.

## Sign-off

Reviewer: ___________ Date: ___________ Build SHA: ___________
