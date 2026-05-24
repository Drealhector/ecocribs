'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/design/Button';
import { Pen, Type, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Easy signature — SignWell-style.
 *
 * First sign:   Type your name (renders in cursive) OR draw on a touch pad.
 * Repeat signs: One-tap "Use my saved signature" inserts the same one you
 *               used last time. Saved per device in localStorage; works
 *               across documents on the same browser.
 *
 * Stored payload is identical regardless of how it was captured:
 *   pngDataUrl  — bitmap
 *   sha256      — hash
 *   plus IP, time, device fingerprint, consent — bundled by the parent.
 */
export type SignaturePayload = {
  pngDataUrl: string;
  sha256: string;
  viewDurationMs: number;
  deviceFingerprint: string;
  consentText: string;
  consentVersion: number;
  acceptedAt: number;
  method: 'typed' | 'drawn' | 'saved';
};

type Mode = 'type' | 'draw';

type SavedSig = {
  pngDataUrl: string;
  sha256: string;
  method: 'typed' | 'drawn';
  savedAt: number;
};

const STORAGE_KEY = 'ecocribs.savedSignature.v1';

function loadSavedSignature(): SavedSig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function SignaturePad({
  consentText,
  consentVersion = 1,
  onSign,
  signerName,
}: {
  consentText: string;
  consentVersion?: number;
  signerName: string;
  onSign: (payload: SignaturePayload) => void | Promise<void>;
}) {
  const [saved, setSaved] = useState<SavedSig | null>(null);
  const [useSaved, setUseSaved] = useState(false);
  const [mode, setMode] = useState<Mode>('type');
  const [typed, setTyped] = useState(signerName);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [saveForLater, setSaveForLater] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Draw state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const mountedAt = useRef<number>(Date.now());

  // Load saved signature on mount
  useEffect(() => {
    const s = loadSavedSignature();
    if (s) {
      setSaved(s);
      setUseSaved(true);
    }
  }, []);

  // Set up canvas DPI when we switch into draw mode
  useEffect(() => {
    if (mode !== 'draw' || useSaved) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#042551';
    ctx.lineWidth = 2.5;
  }, [mode, useSaved]);

  const start = useCallback((x: number, y: number) => { drawing.current = true; last.current = { x, y }; }, []);
  const move = useCallback((x: number, y: number) => {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
    if (!hasInk) setHasInk(true);
  }, [hasInk]);
  const end = useCallback(() => { drawing.current = false; last.current = null; }, []);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, kind: 'start' | 'move' | 'end') => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (kind === 'start') start(x, y);
    else if (kind === 'move') move(x, y);
    else end();
  };

  const clearDraw = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const removeSaved = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSaved(null);
    setUseSaved(false);
  };

  const canSubmit =
    consentAccepted &&
    !submitting &&
    (useSaved || (mode === 'type' ? typed.trim().length >= 2 : hasInk));

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let png: string;
      let method: SignaturePayload['method'];

      if (useSaved && saved) {
        png = saved.pngDataUrl;
        method = 'saved';
      } else if (mode === 'type') {
        png = await renderTypedToPng(typed.trim());
        method = 'typed';
      } else {
        png = canvasRef.current?.toDataURL('image/png') ?? '';
        method = 'drawn';
      }

      if (!png) throw new Error('Could not capture signature');
      const sha256 = await sha256Hex(png);

      // Save for future documents if requested (and this isn't already saved)
      if (saveForLater && !useSaved) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            pngDataUrl: png,
            sha256,
            method: method === 'saved' ? 'typed' : method,
            savedAt: Date.now(),
          } satisfies SavedSig));
        } catch { /* localStorage may be unavailable; ignore */ }
      }

      const fingerprint = await deviceFingerprint();
      await onSign({
        pngDataUrl: png,
        sha256,
        viewDurationMs: Date.now() - mountedAt.current,
        deviceFingerprint: fingerprint,
        consentText,
        consentVersion,
        acceptedAt: Date.now(),
        method,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Saved-signature shortcut */}
      {saved && (
        <div
          className={cn(
            'rounded-md border p-3 transition-colors',
            useSaved ? 'border-brand-green bg-brand-green-soft' : 'border-border bg-canvas-warm',
          )}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Use your saved signature</p>
              <p className="text-2xs text-ink-soft mt-0.5">One tap and you&apos;re done.</p>
              <div className="mt-3 inline-block rounded-md border border-border-subtle bg-canvas px-4 py-2">
                <img src={saved.pngDataUrl} alt="Your saved signature" className="h-12 w-auto" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setUseSaved(true)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    useSaved ? 'bg-brand-green text-white' : 'border border-border bg-canvas text-ink hover:bg-canvas-warm',
                  )}
                >
                  {useSaved ? '✓ Will use this' : 'Use this'}
                </button>
                <button
                  type="button"
                  onClick={() => setUseSaved(false)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    !useSaved ? 'bg-ink text-white' : 'border border-border bg-canvas text-ink hover:bg-canvas-warm',
                  )}
                >
                  Sign fresh
                </button>
                <button
                  type="button"
                  onClick={removeSaved}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-ink-soft hover:text-danger"
                >
                  <Trash2 className="h-3 w-3" /> Forget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New signature input (hidden if using saved) */}
      {!useSaved && (
        <>
          <div role="tablist" aria-label="Signature mode" className="inline-flex rounded-md border border-border bg-canvas-warm p-1 text-sm">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'type'}
              onClick={() => setMode('type')}
              className={cn(
                'inline-flex items-center gap-2 rounded-sm px-4 py-2 font-medium transition-colors',
                mode === 'type' ? 'bg-canvas text-ink shadow-soft' : 'text-ink-soft hover:text-ink',
              )}
            >
              <Type className="h-4 w-4" /> Type
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'draw'}
              onClick={() => setMode('draw')}
              className={cn(
                'inline-flex items-center gap-2 rounded-sm px-4 py-2 font-medium transition-colors',
                mode === 'draw' ? 'bg-canvas text-ink shadow-soft' : 'text-ink-soft hover:text-ink',
              )}
            >
              <Pen className="h-4 w-4" /> Draw
            </button>
          </div>

          {mode === 'type' ? (
            <div className="rounded-md border border-border bg-canvas-warm p-4">
              <label htmlFor="typed-sig" className="text-2xs uppercase tracking-wider font-medium text-ink-soft block mb-2">
                Type your full name as your signature
              </label>
              <input
                id="typed-sig"
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={signerName}
                autoComplete="off"
                className="block w-full bg-transparent border-0 border-b-2 border-border focus:border-brand-orange focus:outline-none text-ink py-2 text-base"
              />
              <div className="mt-5 min-h-[110px] rounded-md bg-canvas border border-border-subtle p-4 flex items-center justify-center">
                {typed.trim() ? (
                  <span
                    className="font-script text-5xl sm:text-6xl text-brand-navy leading-none"
                    style={{ fontFamily: 'var(--font-script), "Dancing Script", cursive' }}
                  >
                    {typed.trim()}
                  </span>
                ) : (
                  <span className="text-ink-soft text-sm">Your signature will appear here</span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-canvas-warm p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-2xs uppercase tracking-wider font-medium text-ink-soft">
                  Sign with your finger or mouse
                </p>
                <button
                  type="button"
                  onClick={clearDraw}
                  disabled={!hasInk}
                  className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
              </div>
              <canvas
                ref={canvasRef}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onPointer(e, 'start'); }}
                onPointerMove={(e) => onPointer(e, 'move')}
                onPointerUp={(e) => onPointer(e, 'end')}
                onPointerLeave={(e) => onPointer(e, 'end')}
                className="block w-full h-44 sm:h-56 touch-none rounded-md border border-dashed border-border bg-canvas cursor-crosshair"
                aria-label="Signature pad"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveForLater}
              onChange={(e) => setSaveForLater(e.target.checked)}
              className="h-4 w-4 rounded border-border text-brand-green focus:ring-brand-green/40"
            />
            Save my signature on this device so I don&apos;t have to redraw it next time.
          </label>
        </>
      )}

      {/* Consent */}
      <label className="flex items-start gap-3 text-sm text-ink-muted cursor-pointer select-none border-t border-border-subtle pt-4">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-brand-orange focus:ring-brand-orange/40"
        />
        <span>{consentText}</span>
      </label>

      {/* Big sign button */}
      <Button onClick={submit} disabled={!canSubmit} size="lg" className="w-full text-base">
        {submitting ? 'Recording signature…' : 'Sign document'}
      </Button>
    </div>
  );
}

/* ───────────────── helpers ───────────────── */

async function renderTypedToPng(text: string): Promise<string> {
  const width = 600;
  const height = 200;
  const c = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  c.width = width * dpr;
  c.height = height * dpr;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#042551';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  let size = 90;
  while (size > 28) {
    ctx.font = `600 ${size}px "Dancing Script", cursive`;
    const m = ctx.measureText(text);
    if (m.width < width - 40) break;
    size -= 4;
  }
  ctx.font = `600 ${size}px "Dancing Script", cursive`;
  ctx.fillText(text, width / 2, height / 2);
  return c.toDataURL('image/png');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function deviceFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    String(new Date().getTimezoneOffset()),
    navigator.language,
  ].join('|');
  return sha256Hex(parts);
}
