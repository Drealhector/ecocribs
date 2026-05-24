# EcoCribs Documentation Portal

White-labelled real estate documentation portal for EcoCribs Realty (Lagos / Delta, Nigeria). Takes a buyer from payment confirmation through deed of assignment with status-tracked, e-signed, WhatsApp-notified workflow.

## Stack

- **Frontend** Next.js 15 (App Router, PWA) + Tailwind v3 + Poppins/Lato/IBM Plex Mono
- **Backend** Convex (DB + realtime functions + cron + file storage for ephemeral)
- **Auth** Clerk (Organizations + magic link + SMS OTP + MFA)
- **Storage** Cloudflare R2 (zero-egress, Lagos PoP)
- **PDFs** pdf-lib in Convex actions
- **E-signature** Documenso (self-hosted) + DocuSign for high-value escalation
- **Notifications** Twilio WhatsApp Business + Resend email + Convex realtime in-app
- **KYC** Smile Identity (BVN / NIN / address / liveness)
- **Search** Convex search index (v1), Meilisearch (v2)

## Repo layout

```
apps/web/           Next.js client + admin + witness surfaces
convex/             Schema, functions, crons, auth wrappers
workers/            Cloudflare Workers (R2 watermarking, AV scan)
packages/           Shared, legal-reviewed PDF templates and copy
docs/               Architecture notes + runbooks
```

## Getting started

```bash
pnpm install
cp .env.example apps/web/.env.local   # fill in keys
pnpm convex:dev                       # in a separate terminal
pnpm dev
```

Open http://localhost:3000.

## Critical compliance gates (do not launch without)

1. SCUML registration filed with EFCC
2. DPO appointed; DPCO engaged; 2026 CAR filed by **30 May 2026**
3. WhatsApp Business templates approved by Meta
4. Legal-counsel review of every PDF template under `packages/pdf-templates/`
5. Hybrid wet-ink flow enabled for Deed of Assignment (`deals.requiresWetInkDeed = true` by default)

See [docs/architecture](./docs/architecture/) for the full plan and risk register.
