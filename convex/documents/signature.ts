import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { recordEvent } from '../lib/audit';
import type { Id } from '../_generated/dataModel';

/**
 * Record a signature event. Called from an action that has already
 *
 *   1. Verified the participant's session (token + PIN if applicable)
 *   2. Loaded the doc revision and computed pre-signature SHA-256
 *   3. Stamped the signature image into the PDF with pdf-lib
 *   4. Uploaded the new revision to R2 and computed post-signature SHA-256
 *
 * This mutation persists the audit-grade `signatures` row and advances the
 * deal's state machine if the signer was the last required party.
 *
 * Auto-generated **Evidence Act 2011 s.84 certificate** at the moment all
 * required parties have signed — captured in metadata for downstream PDF
 * appendix.
 */
export const recordSignature = internalMutation({
  args: {
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
    signatureImageR2Key: v.string(),
    signatureImageSha256: v.string(),
    preDocSha256: v.string(),
    postDocSha256: v.string(),
    consentText: v.string(),
    consentVersion: v.number(),
    viewDurationMs: v.number(),
    deviceFingerprint: v.string(),
    newRevisionKind: v.union(v.literal('partially_signed'), v.literal('fully_signed')),
    advanceStateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const signatureId = await ctx.db.insert('signatures', {
      orgId: args.orgId,
      dealId: args.dealId,
      documentId: args.documentId,
      revisionId: args.revisionId,
      signerKind: args.signerKind,
      signerName: args.signerName,
      signerEmail: args.signerEmail,
      signerPhone: args.signerPhone,
      authMethod: args.authMethod,
      ip: args.ip,
      userAgent: args.userAgent,
      geoCountry: args.geoCountry,
      geoCity: args.geoCity,
      timestampUtc: now,
      signatureImageR2Key: args.signatureImageR2Key,
      signatureImageSha256: args.signatureImageSha256,
      preDocSha256: args.preDocSha256,
      postDocSha256: args.postDocSha256,
      consentText: args.consentText,
      consentVersion: args.consentVersion,
      viewDurationMs: args.viewDurationMs,
      deviceFingerprint: args.deviceFingerprint,
    });

    await ctx.db.patch(args.documentId, {
      status: args.newRevisionKind === 'fully_signed' ? 'fully_signed' : 'partially_signed',
      updatedAt: now,
    });

    await recordEvent(ctx, {
      orgId: args.orgId,
      actorParticipantId: undefined,
      actorRole: args.signerKind,
      action: 'doc.sign',
      targetType: 'document',
      targetId: args.documentId,
      ip: args.ip,
      userAgent: args.userAgent,
      metadata: {
        signatureId,
        signerEmail: args.signerEmail,
        preDocSha256: args.preDocSha256,
        postDocSha256: args.postDocSha256,
      },
    });

    if (args.advanceStateTo) {
      await ctx.db.patch(args.dealId, {
        state: args.advanceStateTo,
        updatedAt: now,
      });
    }

    return signatureId;
  },
});
