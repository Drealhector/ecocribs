/**
 * Per-device saved signature, persisted in localStorage so the customer
 * doesn't have to redraw on every document.
 *
 * Storage key v1. Bump the version if the payload shape ever changes.
 */
export type SavedSig = {
  pngDataUrl: string;
  sha256: string;
  method: 'typed' | 'drawn';
  savedAt: number;
};

const STORAGE_KEY = 'ecocribs.savedSignature.v1';

export function loadSavedSignature(): SavedSig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSig;
  } catch {
    return null;
  }
}

export function saveSignature(s: SavedSig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* localStorage may be unavailable */ }
}

export function clearSavedSignature() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* noop */ }
}
