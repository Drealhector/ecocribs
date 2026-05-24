# Architecture

## What this is

A Next.js 15 + Convex + Clerk + Cloudflare R2 + Documenso build of the **EcoCribs Documentation Portal** — a white-labelled, status-tracked, e-signed real estate transaction tool for EcoCribs Realty (Lekki, Lagos). 5-stage flow: Payment Confirmation → Offer Letter → Contract of Sale → Survey Plan → Deed of Assignment.

## What this is not

- A marketing site (ecocribsrealty.com keeps that).
- A property listing tool. No MLS, no search, no public catalogue.
- A payment processor — payment confirmation is recorded manually by Documentation Officers.

## Key invariants (do not violate)

1. **Every business row has `orgId`**, indexed, non-null. Only `users` and `orgs` are exempt.
2. **All money is in kobo** (₦1 = 100 kobo). Never floats.
3. **Revisions are immutable.** Never overwrite an R2 key. New revision = new key, derived from sha256.
4. **Audit log is append-only**, hash-chained, retained 7 years minimum.
5. **External participants are not users.** Clients and witnesses authenticate via single-use invitation tokens — no Clerk account.
6. **404, not 403** — when an actor can't see a record, return `NOT_FOUND` to prevent existence-probing.
7. **The Deed of Assignment is wet-ink by default** (`deals.requiresWetInkDeed = true`). The portal does not pretend an e-signature perfects title in Lagos.

## State machine

See [state-machine.md](./state-machine.md). Transitions are enforced in `convex/lib/authz.ts::assertValidTransition`. Overrides require manager or admin role + a logged reason.

## Authorization

- Authentication: Clerk Organizations (admins, managers, documentation officers, agents).
- External participants: tokenized `invitations` rows, 72h TTL, single-use.
- Authorization is enforced server-side in `convex/lib/withAuth.ts` and entity-level helpers in `authz.ts`. Direct `ctx.db` is banned outside these modules.

## Document lifecycle

```
template (counsel-approved) ──▶ generate (pdf-lib, AcroForm fill, flatten)
                                  │
                                  ▼
                      revision[1] (kind: original)
                                  │
                send for signature │
                                  ▼
                      revision[2] (kind: sent_snapshot)
                                  │
                  signer signs    │ (canvas → png → hash)
                                  ▼
                      revision[3] (kind: partially_signed | fully_signed)
                                  │
                                  ▼
                      (for deed only)  wet ink uploaded
                                  │
                                  ▼
                      revision[N] (kind: wet_ink_scan)
                                  │
                                  ▼
                       status = executed → retainUntil = +12y
```

## Notifications

WhatsApp via Twilio (templates pre-approved by Meta), email via Resend, in-app via Convex realtime. Reminders cascade 24h → 72h → 7d. WhatsApp failures fall back to email. SMS is out of scope for v1.

## Compliance

- **NDPA + GAID 2025** — granular consent, breach notification ≤72h, retention floors, DPO + DPCO required (CAR due 30 May 2026).
- **SCUML** — DNFBP registration, CTR/STR via NFIU goAML portal.
- **Evidence Act 2011 s.84** — signatures captured with full audit trail; s.84 certificate auto-generated per envelope at completion.
- **FCCPA** — CAC/RC + physical office address required in footer.

See the compliance runbooks under [`/docs/runbooks`](../runbooks/) (TODO: populate before launch).

## Repo layout

```
apps/web/             Next.js 15 — admin, client, witness, public landing
convex/               Schema + functions + crons + webhooks
workers/              Cloudflare Workers (R2 watermarking, AV scan)
packages/pdf-templates/  Counsel-approved PDFs (TODO: counsel sign-off)
packages/legal/       NDPA notice, terms, cookie copy (TODO: counsel sign-off)
docs/                 This.
```

## Operational gates before launch

1. SCUML registration filed
2. DPO appointed; DPCO engaged; 2026 CAR filed (deadline 30 May 2026)
3. WhatsApp Business Meta templates approved
4. Every template under `packages/pdf-templates/` counsel-approved
5. Penetration test passed (focus on IDOR, token replay, signed-URL leak)
6. Backup + restore drill completed against staging
7. On-call rota staffed
