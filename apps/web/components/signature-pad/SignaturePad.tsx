'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/design/Button';
import { cn } from '@/lib/utils';

/**
 * Touch-or-mouse signature pad. Captures more than the drawn ink — it also
 * records the audit trail metadata our `signatures` row requires:
 *
 *   - viewDurationMs: how long the doc was on screen before the user signed
 *   - deviceFingerprint: low-entropy UA + screen + tz hash (defense-in-depth)
 *   - signatureImageSha256: hash of the rendered PNG bitmap
 *   - consentText + consentVersion: the exact disclosure the user accepted
 *
 * The rendered ink is exported as a PNG data URL plus its SHA-256, both
 * returned to the parent. The parent posts to a Convex action that:
 *   - re-hashes (don't trust the client's hash)
 *   - stamps the image into the PDF at the template-mapped bbox
 *   - persists `signatures` + advances deal state
 */
export type SignaturePayload = {
  pngDataUrl: string;
  sha256: string;
  viewDurationMs: number;
  deviceFingerprint: string;
  consentText: string;
  consentVersion: number;
  acceptedAt: number;
};

export function SignaturePad({
  width = 600,
  height = 220,
  consentText,
  consentVersion = 1,
  onSign,
  signerName,
}: {
  width?: number;
  height?: number;
  consentText: string;
  consentVersion?: number;
  signerName: string;
  onSign: (payload: SignaturePayload) => void | Promise<void>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const mountedAt = useRef<number>(Date.now());
  const [hasInk, setHasInk] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr;
    c.height = height * dpr;
    c.style.width = `${width}px`;
    c.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#042551';
    ctx.lineWidth = 2.2;
  }, [width, height]);

  const start = useCallback((x: number, y: number) => {
    drawing.current = true;
    last.current = { x, y };
  }, []);

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

  const end = useCallback(() => {
    drawing.current = false;
    last.current = null;
  }, []);

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

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const submit = async () => {
    if (!hasInk || !consentAccepted || submitting) return;
    const c = canvasRef.current;
    if (!c) return;
    setSubmitting(true);
    try {
      const pngDataUrl = c.toDataURL('image/png');
      const sha256 = await sha256Hex(pngDataUrl);
      const fingerprint = await deviceFingerprint();
      await onSign({
        pngDataUrl,
        sha256,
        viewDurationMs: Date.now() - mountedAt.current,
        deviceFingerprint: fingerprint,
        consentText,
        consentVersion,
        acceptedAt: Date.now(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-canvas-warm p-3">
        <p className="text-xs uppercase tracking-wider font-medium text-ink-soft mb-2">
          {signerName} — sign below
        </p>
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onPointer(e, 'start'); }}
          onPointerMove={(e) => onPointer(e, 'move')}
          onPointerUp={(e) => onPointer(e, 'end')}
          onPointerLeave={(e) => onPointer(e, 'end')}
          className={cn(
            'block w-full touch-none rounded-md border border-dashed border-border bg-canvas',
            'cursor-crosshair',
          )}
          aria-label="Signature pad"
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={clear}
            className="text-xs text-ink-soft hover:text-ink underline-offset-2 hover:underline"
            disabled={!hasInk}
          >
            Clear
          </button>
          <span className="text-2xs text-ink-soft tabular">
            {hasInk ? 'Signed' : 'Awaiting signature'}
          </span>
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-muted cursor-pointer">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-brand-orange focus:ring-brand-orange/40"
        />
        <span>{consentText}</span>
      </label>

      <Button onClick={submit} disabled={!hasInk || !consentAccepted || submitting} size="lg">
        {submitting ? 'Recording signature…' : 'Sign document'}
      </Button>
    </div>
  );
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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
