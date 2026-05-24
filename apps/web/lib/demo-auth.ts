/**
 * Preview-mode credentials.
 *
 * In production these don't exist — Clerk handles staff auth, and clients
 * use single-use magic-link + WhatsApp PIN. These hardcoded creds exist
 * only so reviewers can experience the full UX without spinning up Clerk.
 */
export const DEMO_USERNAME = 'hector';
export const DEMO_PASSWORD = 'testing 123';

/**
 * Accepts the original staff demo cred (hector / testing 123) OR the
 * customer demo cred (customer@gmail.com / 1234). Both shortcut into
 * the preview UI for testing without going through real Convex Auth.
 */
export function checkDemoCredentials(username: string, password: string): boolean {
  const u = username.trim().toLowerCase();
  const p = password.trim();
  if (u === DEMO_USERNAME && (p === DEMO_PASSWORD || p === 'testing123')) return true;
  if ((u === 'hector@ecocribsrealty.com' || u === 'hector@gmail.com') && (p === DEMO_PASSWORD || p === 'testing123')) return true;
  if (u === 'customer@gmail.com' && p === '1234') return true;
  return false;
}
