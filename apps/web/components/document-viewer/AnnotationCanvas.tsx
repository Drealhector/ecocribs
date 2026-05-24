'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Type, PenTool, Calendar, X, Info, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadSavedSignature, type SavedSig } from '@/lib/saved-signature';

/**
 * Click-anywhere annotation canvas — drop text, your saved signature, or
 * a date at any spot on the page. For witness signatures, free-form notes,
 * dates next to inline blanks — anything the template didn't anticipate.
 *
 * Each annotation stores its position as percentages (x%, y%) relative to
 * the canvas size, so it survives resize and renders correctly when later
 * stamped into the real PDF.
 */
export type Annotation =
  | { id: string; kind: 'text';      xPct: number; yPct: number; value: string }
  | { id: string; kind: 'signature'; xPct: number; yPct: number; pngDataUrl: string }
  | { id: string; kind: 'date';      xPct: number; yPct: number; value: string };

type Tool = 'text' | 'signature' | 'date' | null;

const newId = () => `ann_${Math.random().toString(36).slice(2, 10)}`;

export function AnnotationCanvas({
  annotations,
  onChange,
}: {
  annotations: Annotation[];
  onChange: (next: Annotation[]) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>(null);
  const [saved, setSaved] = useState<SavedSig | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => { setSaved(loadSavedSignature()); }, []);

  // Show a one-shot hint the first time a tool is selected
  useEffect(() => {
    if (tool) {
      const map: Record<Exclude<Tool, null>, string> = {
        text: 'Tap anywhere on the page to drop a text box.',
        signature: saved
          ? 'Tap anywhere on the page to stamp your saved signature.'
          : 'Sign once below first — then come back to stamp it anywhere.',
        date: 'Tap anywhere on the page to drop today’s date.',
      };
      setHint(map[tool]);
    } else {
      setHint(null);
    }
  }, [tool, saved]);

  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tool) return;
    if (tool === 'signature' && !saved) {
      // Block placement; tell user to sign first
      setHint('Sign once below first — then stamp your signature here.');
      setTool(null);
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const id = newId();
    const created: Annotation =
      tool === 'text'
        ? { id, kind: 'text', xPct, yPct, value: '' }
        : tool === 'date'
          ? { id, kind: 'date', xPct, yPct, value: new Date().toISOString().slice(0, 10) }
          : { id, kind: 'signature', xPct, yPct, pngDataUrl: saved!.pngDataUrl };
    onChange([...annotations, created]);
    setTool(null); // back to neutral after each drop
  }, [tool, saved, annotations, onChange]);

  const updateAnn = (id: string, patch: Partial<Annotation>) => {
    onChange(annotations.map((a) => (a.id === id ? ({ ...a, ...patch } as Annotation) : a)));
  };
  const removeAnn = (id: string) => onChange(annotations.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xs uppercase tracking-wider font-medium text-ink-soft mr-1 flex items-center gap-1">
          <MousePointerClick className="h-3.5 w-3.5" /> Click on the page to add:
        </span>
        <ToolButton active={tool === 'text'} onClick={() => setTool(tool === 'text' ? null : 'text')}>
          <Type className="h-3.5 w-3.5" /> Text
        </ToolButton>
        <ToolButton active={tool === 'signature'} onClick={() => setTool(tool === 'signature' ? null : 'signature')}>
          <PenTool className="h-3.5 w-3.5" /> Signature
        </ToolButton>
        <ToolButton active={tool === 'date'} onClick={() => setTool(tool === 'date' ? null : 'date')}>
          <Calendar className="h-3.5 w-3.5" /> Today's date
        </ToolButton>
      </div>

      {hint && (
        <p className="text-xs text-brand-orange flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {hint}
        </p>
      )}

      {/* The "page" — interactive */}
      <div
        ref={canvasRef}
        onClick={onCanvasClick}
        className={cn(
          'relative aspect-[8.5/11] w-full rounded-md border bg-white shadow-card overflow-hidden select-none',
          tool ? 'cursor-crosshair border-brand-orange' : 'border-border',
        )}
      >
        {/* Faux page lines so it reads as a document */}
        <div
          aria-hidden
          className="absolute inset-x-8 top-12 bottom-8 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(transparent, transparent 28px, rgba(0,0,0,0.07) 28px, rgba(0,0,0,0.07) 29px)',
          }}
        />
        <div aria-hidden className="absolute top-3 left-8 text-2xs uppercase tracking-wider text-ink-soft/40 pointer-events-none">
          Page 1
        </div>

        {/* Annotations */}
        {annotations.map((a) => (
          <AnnotationView
            key={a.id}
            ann={a}
            onUpdate={(patch) => updateAnn(a.id, patch)}
            onRemove={() => removeAnn(a.id)}
          />
        ))}

        {annotations.length === 0 && !tool && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none text-ink-soft/60 text-sm">
            Pick a tool above, then tap anywhere on the page.
          </div>
        )}
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-brand-orange bg-brand-orange text-white'
          : 'border-border bg-canvas text-ink hover:bg-canvas-warm',
      )}
    >
      {children}
    </button>
  );
}

function AnnotationView({
  ann, onUpdate, onRemove,
}: {
  ann: Annotation;
  onUpdate: (patch: Partial<Annotation>) => void;
  onRemove: () => void;
}) {
  const positionStyle = {
    left: `${ann.xPct}%`,
    top: `${ann.yPct}%`,
    transform: 'translate(-2px, -2px)',
  } as const;

  return (
    <div
      style={positionStyle}
      className="absolute group"
      // Stop clicks here from creating a NEW annotation on the canvas
      onClick={(e) => e.stopPropagation()}
    >
      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove annotation"
        className="absolute -top-2 -right-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-ink text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>

      {ann.kind === 'text' && (
        <textarea
          autoFocus
          value={ann.value}
          onChange={(e) => onUpdate({ value: e.target.value } as Partial<Annotation>)}
          placeholder="Type here…"
          rows={1}
          className="block min-w-[120px] max-w-[260px] rounded-sm border border-brand-orange/40 bg-yellow-50/80 px-1.5 py-0.5 text-xs sm:text-sm text-ink resize-y focus:outline-none focus:border-brand-orange focus:bg-yellow-50"
          style={{ fontFamily: 'inherit' }}
        />
      )}
      {ann.kind === 'date' && (
        <input
          type="date"
          value={ann.value}
          onChange={(e) => onUpdate({ value: e.target.value } as Partial<Annotation>)}
          className="rounded-sm border border-brand-orange/40 bg-yellow-50/80 px-1.5 py-0.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-brand-orange focus:bg-yellow-50"
        />
      )}
      {ann.kind === 'signature' && (
        <div className="rounded-sm border border-brand-green/40 bg-white p-1 shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ann.pngDataUrl} alt="Signature" className="h-10 sm:h-12 w-auto" draggable={false} />
        </div>
      )}
    </div>
  );
}
