import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Id } from '../_generated/dataModel';

/**
 * Generate a Receipt PDF after payment confirmation.
 *
 * Real implementation:
 *   1. Load active receipt template for the org
 *   2. Fetch template PDF bytes from R2
 *   3. Use pdf-lib to fill AcroForm fields + flatten
 *   4. Compute SHA-256
 *   5. Upload to R2 at content-addressed key
 *   6. Create document + initial revision rows
 *   7. Dispatch notifications (email + WhatsApp + in-app)
 *   8. Advance deal state to OFFER_LETTER_AWAITING_CLIENT
 *
 * Stubbed here — the PDF rendering and R2 upload happen in a Convex action
 * since they require fetch + crypto.subtle (which the V8 runtime supports
 * but the JS runtime exposes only inside actions, not queries/mutations).
 */
export const generateReceipt = internalAction({
  args: { dealId: v.id('deals') },
  handler: async (ctx, args): Promise<{ documentId: Id<'documents'>; revisionId: Id<'revisions'> }> => {
    const deal = await ctx.runQuery(internal.documents.generate._getDealForGeneration, {
      dealId: args.dealId,
    });
    if (!deal) throw new Error('NOT_FOUND');

    // TODO(production): fetch template, fill with pdf-lib, upload to R2,
    // hash, then call _commitGeneratedDocument with the revision metadata.

    const placeholderR2Key = `org/${deal.orgId}/deals/${args.dealId}/docs/receipt/v1-placeholder.pdf`;
    const placeholderSha = '0'.repeat(64);

    const ids = await ctx.runMutation(internal.documents.generate._commitGeneratedDocument, {
      dealId: args.dealId,
      orgId: deal.orgId,
      kind: 'receipt',
      r2Key: placeholderR2Key,
      sha256: placeholderSha,
      sizeBytes: 0,
      pageCount: 1,
      mergeFieldValues: {
        buyerName: deal.buyerName,
        receiptDate: new Date().toISOString().slice(0, 10),
        amountKobo: deal.paidAmountKobo,
        paymentReference: deal.paymentReference,
      },
      createdBy: deal.createdBy,
    });

    await ctx.runMutation(internal.documents.generate._advanceAfterReceipt, {
      dealId: args.dealId,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.dispatch.dispatch, {
      orgId: deal.orgId,
      dealId: args.dealId,
      template: 'receipt.sent',
    });

    return ids;
  },
});

export const _getDealForGeneration = internalQuery({
  args: { dealId: v.id('deals') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.dealId);
  },
});

export const _commitGeneratedDocument = internalMutation({
  args: {
    dealId: v.id('deals'),
    orgId: v.id('orgs'),
    kind: v.union(
      v.literal('receipt'),
      v.literal('offer_letter'),
      v.literal('contract_of_sale'),
      v.literal('survey_plan'),
      v.literal('deed_of_assignment'),
    ),
    r2Key: v.string(),
    sha256: v.string(),
    sizeBytes: v.number(),
    pageCount: v.number(),
    mergeFieldValues: v.any(),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const retainUntil = now + 12 * 365 * 24 * 60 * 60 * 1000; // 12y

    const documentId = await ctx.db.insert('documents', {
      orgId: args.orgId,
      dealId: args.dealId,
      kind: args.kind,
      currentRevisionId: undefined,
      status: 'sent',
      legalHold: false,
      retainUntil,
      createdAt: now,
      updatedAt: now,
    });

    const revisionId = await ctx.db.insert('revisions', {
      documentId,
      parentRevisionId: undefined,
      revisionNumber: 1,
      kind: 'original',
      r2Key: args.r2Key,
      sha256: args.sha256,
      sizeBytes: args.sizeBytes,
      mimeType: 'application/pdf',
      pageCount: args.pageCount,
      mergeFieldValues: args.mergeFieldValues,
      createdBy: args.createdBy,
      createdAt: now,
    });

    await ctx.db.patch(documentId, { currentRevisionId: revisionId });
    return { documentId, revisionId };
  },
});

export const _advanceAfterReceipt = internalMutation({
  args: { dealId: v.id('deals') },
  handler: async (ctx, args) => {
    const deal = await ctx.db.get(args.dealId);
    if (!deal) return;
    if (deal.state !== 'RECEIPT_SENT') return;

    await ctx.db.patch(args.dealId, {
      state: 'OFFER_LETTER_AWAITING_CLIENT',
      statusLabel: 'Awaiting Client',
      updatedAt: Date.now(),
    });
  },
});
