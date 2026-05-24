/**
 * Preview-mode credentials.
 *
 * In production these don't exist — Clerk handles staff auth, and clients
 * use single-use magic-link + WhatsApp PIN. These hardcoded creds exist
 * only so reviewers can experience the full UX without spinning up Clerk.
 */
export const DEMO_USERNAME = 'hector';
export const DEMO_PASSWORD = 'testing 123';

export function checkDemoCredentials(username: string, password: string): boolean {
  const u = username.trim().toLowerCase();
  const p = password.trim();
  return u === DEMO_USERNAME && (p === DEMO_PASSWORD || p === 'testing123');
}
