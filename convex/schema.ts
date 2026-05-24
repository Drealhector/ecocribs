import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

/**
 * EcoCribs Documentation Portal — data model.
 *
 * Invariants:
 *   1. Every business-data row carries `orgId`. Only `users` and `orgs` are exempt.
 *   2. All money values are stored in **kobo** (₦1 = 100 kobo). Never floats.
 *   3. Document revisions are immutable; never overwrite R2 keys.
 *   4. Audit logs are write-only from app code; hash-chained for tamper evidence.
 *   5. External participants (clients, witnesses) are NOT users — they are
 *      `participants` rows authenticated by single-use `invitations` tokens.
 *
 * Retention:
 *   - Sale-related documents (offer, contract, deed): 12 years post-execution
 *     (Lagos Limitation Law s.16 land actions + FIRS 6y buffer).
 *   - Audit logs: 7 years.
 *   - Drafts not executed: 6 years.
 */
export default defineSchema({
  // ───────────────────────── Convex Auth tables ─────────────────────────
  // Spread Convex Auth's bookkeeping tables (authSessions, authAccounts,
  // authVerificationCodes, authRefreshTokens, authVerifiers,
  // authRateLimits). The `users` table from `authTables` is overridden
  // below so we can add our profile fields without losing Convex Auth's
  // required columns.
  ...authTables,

  // ───────────────────────── Identity ─────────────────────────
  // Override Convex Auth's users table to carry our profile fields.
  // The first block of optional fields mirrors Convex Auth's built-in
  // schema (email, name, image, emailVerificationTime, phone,
  // phoneVerificationTime, isAnonymous) — required so the auth library's
  // internal mutations keep working. The second block is our additions.
  users: defineTable({
    // Convex Auth built-ins
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // EcoCribs profile fields
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    mfaEnabled: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
  }).index('email', ['email']),

  orgs: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    legalName: v.optional(v.string()),
    cacNumber: v.optional(v.string()),
    scumlNumber: v.optional(v.string()),
    physicalAddress: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    brand: v.optional(
      v.object({
        primaryHex: v.string(),
        secondaryHex: v.string(),
        logoUrl: v.string(),
      }),
    ),
    governingLawDefault: v.union(v.literal('lagos'), v.literal('delta'), v.literal('federal')),
    createdAt: v.number(),
  }).index('by_clerk_org', ['clerkOrgId']),

  memberships: defineTable({
    userId: v.id('users'),
    orgId: v.id('orgs'),
    role: v.union(
      v.literal('admin'),
      v.literal('manager'),
      v.literal('documentation_officer'),
      v.literal('agent'),
    ),
    status: v.union(v.literal('active'), v.literal('revoked'), v.literal('pending')),
    teamIds: v.array(v.id('teams')),
    invitedBy: v.optional(v.id('users')),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index('by_user_org', ['userId', 'orgId'])
    .index('by_org', ['orgId']),

  teams: defineTable({
    orgId: v.id('orgs'),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_org', ['orgId']),

  // ───────────────────────── Inventory ─────────────────────────
  properties: defineTable({
    orgId: v.id('orgs'),
    name: v.string(),
    estate: v.optional(v.string()),
    state: v.string(),
    lga: v.string(),
    sizeSqm: v.number(),
    plotNumber: v.optional(v.string()),
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    titleType: v.union(
      v.literal('c_of_o'),
      v.literal('governors_consent'),
      v.literal('excision'),
      v.literal('gazette'),
      v.literal('registered_survey'),
      v.literal('family_receipt'),
    ),
    photos: v.array(v.string()),
    listPriceKobo: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_org', ['orgId'])
    .index('by_org_estate', ['orgId', 'estate']),

  // ───────────────────────── Deals ─────────────────────────
  /**
   * The deal is the central object — a single sale of a single property to a
   * single buyer. Joint buyers / co-owners modeled in `dealBuyers` (phase 2).
   *
   * State machine:
   *   AWAITING_PAYMENT_CONFIRMATION
   *   RECEIPT_SENT
   *   OFFER_LETTER_AWAITING_CLIENT
   *   OFFER_DECLINED                      (soft-terminal)
   *   CONTRACT_AWAITING_CLIENT
   *   CONTRACT_AWAITING_WITNESS
   *   CONTRACT_SIGNED
   *   SURVEY_ISSUED
   *   DEED_AWAITING_CLIENT
   *   DEED_AWAITING_WET_INK               (hybrid path, default)
   *   DEED_AWAITING_WITNESS
   *   DEED_SIGNED
   *   AWAITING_GOVERNORS_CONSENT
   *   COMPLETED                           (terminal)
   *   ARCHIVED                            (post-retention)
   */
  deals: defineTable({
    orgId: v.id('orgs'),
    propertyId: v.id('properties'),
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.string(),
    buyerUserId: v.optional(v.id('users')),

    assignedAgentIds: v.array(v.id('users')),
    documentationOfficerId: v.optional(v.id('users')),

    state: v.string(),
    statusLabel: v.string(),
    requiresWetInkDeed: v.boolean(),

    purchasePriceKobo: v.number(),
    paidAmountKobo: v.number(),
    paymentMethod: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    paymentConfirmedAt: v.optional(v.number()),
    paymentConfirmedBy: v.optional(v.id('users')),

    declineReason: v.optional(v.string()),
    declinedAt: v.optional(v.number()),

    completedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),

    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_org_state', ['orgId', 'state'])
    .index('by_org_created', ['orgId', 'createdAt'])
    .index('by_buyer_email', ['buyerEmail'])
    .index('by_assigned_agent', ['assignedAgentIds'])
    .searchIndex('search_buyer', {
      searchField: 'buyerName',
      filterFields: ['orgId', 'state'],
    }),

  // ───────────────────────── Documents ─────────────────────────
  documents: defineTable({
    orgId: v.id('orgs'),
    dealId: v.id('deals'),
    kind: v.union(
      v.literal('receipt'),
      v.literal('offer_letter'),
      v.literal('contract_of_sale'),
      v.literal('survey_plan'),
      v.literal('deed_of_assignment'),
    ),
    currentRevisionId: v.optional(v.id('revisions')),
    status: v.union(
      v.literal('draft'),
      v.literal('sent'),
      v.literal('partially_signed'),
      v.literal('fully_signed'),
      v.literal('executed'),
      v.literal('archived'),
    ),
    templateId: v.optional(v.id('templates')),
    legalHold: v.boolean(),
    legalHoldReason: v.optional(v.string()),
    retainUntil: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_deal', ['dealId'])
    .index('by_deal_kind', ['dealId', 'kind'])
    .index('by_retention', ['retainUntil']),

  revisions: defineTable({
    documentId: v.id('documents'),
    parentRevisionId: v.optional(v.id('revisions')),
    revisionNumber: v.number(),
    kind: v.union(
      v.literal('original'),
      v.literal('edit'),
      v.literal('sent_snapshot'),
      v.literal('partially_signed'),
      v.literal('fully_signed'),
      v.literal('wet_ink_scan'),
    ),
    r2Key: v.string(),
    sha256: v.string(),
    sizeBytes: v.number(),
    mimeType: v.string(),
    pageCount: v.optional(v.number()),
    mergeFieldValues: v.optional(v.any()),
    envelopeId: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_document', ['documentId'])
    .index('by_document_revno', ['documentId', 'revisionNumber'])
    .index('by_sha256', ['sha256']),

  templates: defineTable({
    orgId: v.id('orgs'),
    name: v.string(),
    kind: v.string(),
    version: v.number(),
    basePdfR2Key: v.string(),
    basePdfSha256: v.string(),
    fieldsJson: v.any(),
    governingLaw: v.union(v.literal('lagos'), v.literal('delta'), v.literal('federal')),
    approvedByCounsel: v.boolean(),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id('users')),
    archivedAt: v.optional(v.number()),
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_org_kind', ['orgId', 'kind'])
    .index('by_org_kind_version', ['orgId', 'kind', 'version']),

  // ───────────────────────── External participants ─────────────────────────
  participants: defineTable({
    orgId: v.id('orgs'),
    dealId: v.id('deals'),
    kind: v.union(v.literal('client'), v.literal('witness'), v.literal('guest')),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    occupation: v.optional(v.string()),
    address: v.optional(v.string()),
    idDocumentUrl: v.optional(v.string()),
    selfieUrl: v.optional(v.string()),
    kycRef: v.optional(v.string()),
    kycVerifiedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_deal', ['dealId'])
    .index('by_email', ['email']),

  invitations: defineTable({
    orgId: v.id('orgs'),
    dealId: v.id('deals'),
    participantId: v.optional(v.id('participants')),
    purpose: v.union(
      v.literal('client_login'),
      v.literal('witness_sign'),
      v.literal('guest_view'),
    ),
    tokenHash: v.string(),
    pinHash: v.optional(v.string()),
    scope: v.array(v.string()),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    maxUses: v.number(),
    deliveredVia: v.array(v.union(v.literal('email'), v.literal('whatsapp'), v.literal('sms'))),
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_token', ['tokenHash'])
    .index('by_deal', ['dealId']),

  // ───────────────────────── Signatures (audit-grade) ─────────────────────────
  signatures: defineTable({
    orgId: v.id('orgs'),
    dealId: v.id('deals'),
    documentId: v.id('documents'),
    revisionId: v.id('revisions'),

    signerKind: v.union(v.literal('client'), v.literal('witness'), v.literal('agent')),
    signerName: v.string(),
    signerEmail: v.string(),
    signerPhone: v.string(),

    authMethod: v.union(
      v.literal('magic_link'),
      v.literal('sms_otp'),
      v.literal('logged_in_session'),
      v.literal('wet_ink_scan'),
    ),
    ip: v.string(),
    userAgent: v.string(),
    geoCountry: v.optional(v.string()),
    geoCity: v.optional(v.string()),
    timestampUtc: v.number(),
    rfc3161Token: v.optional(v.string()),

    signatureImageR2Key: v.string(),
    signatureImageSha256: v.string(),
    preDocSha256: v.string(),
    postDocSha256: v.string(),

    consentText: v.string(),
    consentVersion: v.number(),
    viewDurationMs: v.number(),
    deviceFingerprint: v.string(),
  })
    .index('by_document', ['documentId'])
    .index('by_deal', ['dealId']),

  // ───────────────────────── Audit log (write-only, hash-chained) ─────────────────────────
  audit_logs: defineTable({
    orgId: v.id('orgs'),
    actorUserId: v.optional(v.id('users')),
    actorParticipantId: v.optional(v.id('participants')),
    actorRole: v.string(),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.any()),
    at: v.number(),
    hashChain: v.string(),
  })
    .index('by_org_at', ['orgId', 'at'])
    .index('by_org_target', ['orgId', 'targetType', 'targetId'])
    .index('by_org_actor', ['orgId', 'actorUserId']),

  // ───────────────────────── Notifications ─────────────────────────
  notifications: defineTable({
    orgId: v.id('orgs'),
    dealId: v.optional(v.id('deals')),
    recipientUserId: v.optional(v.id('users')),
    recipientParticipantId: v.optional(v.id('participants')),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    channel: v.union(v.literal('email'), v.literal('whatsapp'), v.literal('in_app')),
    template: v.string(),
    payload: v.any(),
    state: v.union(
      v.literal('queued'),
      v.literal('sent'),
      v.literal('delivered'),
      v.literal('read'),
      v.literal('failed'),
    ),
    providerMessageId: v.optional(v.string()),
    queuedAt: v.number(),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index('by_recipient_user', ['recipientUserId', 'queuedAt'])
    .index('by_recipient_participant', ['recipientParticipantId', 'queuedAt'])
    .index('by_provider_msg', ['providerMessageId']),

  reminder_schedule: defineTable({
    orgId: v.id('orgs'),
    dealId: v.id('deals'),
    nextFireAt: v.number(),
    kind: v.union(
      v.literal('gentle_24h'),
      v.literal('escalation_72h'),
      v.literal('admin_7d'),
    ),
    targetStage: v.string(),
    cancelled: v.boolean(),
    firedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_due', ['cancelled', 'nextFireAt'])
    .index('by_deal', ['dealId']),

  // ───────────────────────── Integrity / file-system checks ─────────────────────────
  integrity_checks: defineTable({
    revisionId: v.id('revisions'),
    expectedSha256: v.string(),
    actualSha256: v.string(),
    checkedAt: v.number(),
    status: v.union(v.literal('ok'), v.literal('mismatch')),
    alertedAt: v.optional(v.number()),
  }).index('by_revision_checked', ['revisionId', 'checkedAt']),
});
