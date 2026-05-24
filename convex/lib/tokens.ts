/**
 * Single-use, scope-limited invite tokens.
 *
 *   token  — 32 bytes of CSPRNG randomness, base64url. Sent to recipient.
 *            NEVER stored raw; only sha256(token) is persisted.
 *   pin    — 6 random digits. Sent out-of-band (WhatsApp/SMS) for two-channel
 *            verification. Stored as sha256(pin || tokenId) to prevent rainbow.
 *   ttl    — typically 72h for clients, 7 days for witnesses.
 *   scope  — JSON array like ["deal:read:deal_123","doc:sign:doc_456"].
 *
 * On accept: token+pin verified in constant time; usedAt set atomically.
 */
const TOKEN_BYTES = 32;
const PIN_LENGTH = 6;

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

export function generatePin(): string {
  const buf = crypto.getRandomValues(new Uint8Array(PIN_LENGTH));
  let pin = '';
  for (let i = 0; i < PIN_LENGTH; i++) pin += String((buf[i] ?? 0) % 10);
  return pin;
}

export function hashToken(token: string): Promise<string> {
  return sha256Hex(token);
}

export function hashPin(pin: string, salt: string): Promise<string> {
  return sha256Hex(pin + '|' + salt);
}

/**
 * Constant-time string compare. Both inputs must be hex digests of the same
 * length; the comparison does NOT short-circuit on first mismatch.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
