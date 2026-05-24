'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/design/Button';
import { Pen, Type, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Easy signature — SignWell-style.
 *
 *   Mode 'type': customer types their name → rendered in a natural cursive
 *                script. One field, zero friction. Default.
 *   Mode 'draw': touch-or-mouse pad for those who want a real ink signature.
 *
 * Either way, what we capture is identical:
 *   pngDataUrl  — the rendered signature as a PNG bitmap
 *   sha256      — hash of that PNG
 *   plus IP, time, device fingerprint, time-on-page, consent text — all in
 *   the SignaturePayload the parent posts to the server.
 */
export type SignaturePayload = {
  pngDataUrl: string;
  sha256: string;
  viewDurationMs: number;
  deviceFingerprint: string;
  consentText: string;
  consentVersion: number;
  acceptedAt: number;
  method: 'typed' | 'drawn';
};

type Mode = 'type' | 'draw';

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
  const [mode, setMode] = useState<Mode>('type');
  const [typed, setTyped] = useState(signerName);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Draw state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const mountedAt = useRef<number>(Date.now());

  // Set up canvas DPI when we switch into draw mode
  useEffect(() => {
    if (mode !== 'draw') return;
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
  }, [mode]);

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

  const canSubmit = (mode === 'type' ? typed.trim().length >= 2 : hasInk) && consentAccepted && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const png = mode === 'type'
        ? await renderTypedToPng(typed.trim())
        : (canvasRef.current?.toDataURL('image/png') ?? '');
      if (!png) throw new Error('Could not capture signature');
      const sha256 = await sha256Hex(png);
      const fingerprint = await deviceFingerprint();
      await onSign({
        pngDataUrl: png,
        sha256,
        viewDurationMs: Date.now() - mountedAt.current,
        deviceFingerprint: fingerprint,
        consentText,
        consentVersion,
        acceptedAt: Date.now(),
        method: mode === 'type' ? 'typed' : 'drawn',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
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

      {/* Pad */}
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
          <p className="mt-2 text-2xs text-ink-soft text-center">
            {hasInk ? 'Looks good — accept below to sign.' : 'Draw your signature anywhere in the box above'}
          </p>
        </div>
      )}

      {/* Consent */}
      <label className="flex items-start gap-3 text-sm text-ink-muted cursor-pointer select-none">
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
  // Render the typed name onto an offscreen canvas in the same cursive font
  // so we have a real PNG to upload + hash, identical to the drawn path.
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
  // Try a sensible size that fits the longest names
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
