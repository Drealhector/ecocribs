/**
 * Single-use, scope-limited invite tokens.
 *
 *   token — 32 bytes of CSPRNG randomness, base64url. Sent to recipient.
 *           NEVER stored raw; only sha256(token) is persisted.
 *   ttl   — typically 72h for clients, 7 days for witnesses.
 *   scope — JSON array like ["deal:read:deal_123","doc:sign:doc_456"].
 */
const TOKEN_BYTES = 32;

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateToken(): string {
  const buf = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return toBase64Url(buf);
}

export function hashToken(token: string): Promise<string> {
  return sha256Hex(token);
}
