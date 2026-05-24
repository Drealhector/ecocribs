import { NextRequest } from 'next/server';

/**
 * Customer / staff downloads a signed document.
 *
 * Right now this is a placeholder — once Cloudflare R2 is wired and real
 * PDF generation + stamping is in place, the handler will:
 *   1. Verify the caller has access to this document (Convex Auth user OR
 *      participant session for clients/witnesses)
 *   2. Look up the current revision's R2 key from Convex
 *   3. Mint a 60-second signed R2 URL
 *   4. 302-redirect the browser there
 *
 * For now: 503 with a friendly message so the UI fallback shows up.
 */
export async function GET(_req: NextRequest, _ctx: { params: Promise<{ docId: string }> }) {
  return new Response(
    JSON.stringify({
      error: 'document_storage_not_configured',
      message: 'Document downloads will be available once Cloudflare R2 is wired and the first signed PDF lands.',
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' },
    },
  );
}
