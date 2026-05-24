'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, User, FileText, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Inline fields the customer types into the document before signing —
 * SignWell-style "fill in the blanks" experience. Each field has a type
 * (date / text / name / address / number) which controls keyboard + default.
 *
 * v1: a fixed sensible set of fields per document kind. v2 (later): fields
 * defined per-template by the admin.
 */
export type DocFieldDef = {
  key: string;
  label: string;
  type: 'date' | 'text' | 'name' | 'address' | 'number';
  required?: boolean;
  prefill?: string;
  helper?: string;
};

export type DocFieldValues = Record<string, string>;

export function defaultFieldsForKind(
  kind: 'receipt' | 'offer_letter' | 'contract_of_sale' | 'survey_plan' | 'deed_of_assignment',
  buyerName: string,
): DocFieldDef[] {
  const today = new Date().toISOString().slice(0, 10);
  const base: DocFieldDef[] = [
    { key: 'date_signed', label: 'Date signed', type: 'date', required: true, prefill: today },
    { key: 'full_name', label: 'Your full name', type: 'name', required: true, prefill: buyerName },
  ];
  if (kind === 'contract_of_sale' || kind === 'deed_of_assignment') {
    base.push(
      { key: 'address', label: 'Your residential address', type: 'address', required: true, helper: 'Where you currently live (for the record)' },
      { key: 'occupation', label: 'Occupation', type: 'text', required: false },
    );
  }
  if (kind === 'offer_letter') {
    base.push(
      { key: 'address', label: 'Your residential address', type: 'address', required: true },
    );
  }
  return base;
}

export function DocumentFields({
  fields,
  values,
  onChange,
}: {
  fields: DocFieldDef[];
  values: DocFieldValues;
  onChange: (next: DocFieldValues) => void;
}) {
  // Auto-prefill empty fields on mount
  useEffect(() => {
    const next: DocFieldValues = { ...values };
    let dirty = false;
    for (const f of fields) {
      if (next[f.key] === undefined && f.prefill !== undefined) {
        next[f.key] = f.prefill;
        dirty = true;
      }
    }
    if (dirty) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium text-ink-soft">
        <Hash className="h-3.5 w-3.5" />
        Fill in
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <Field
            key={f.key}
            def={f}
            value={values[f.key] ?? ''}
            onChange={(v) => onChange({ ...values, [f.key]: v })}
          />
        ))}
      </div>
    </div>
  );
}

function Field({
  def, value, onChange,
}: {
  def: DocFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const Icon = iconFor(def.type);
  const inputType = def.type === 'date' ? 'date' : def.type === 'number' ? 'number' : 'text';
  const filled = value.trim().length > 0;
  return (
    <label className="block">
      <div className="flex items-center gap-2 text-sm font-medium text-ink mb-1.5">
        <Icon className="h-4 w-4 text-ink-soft" />
        {def.label}
        {def.required && <span className="text-brand-orange">*</span>}
        {filled && <span className="ml-auto text-2xs text-brand-green font-medium">✓ Filled</span>}
      </div>
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={def.required}
        autoComplete={
          def.type === 'name' ? 'name' :
          def.type === 'address' ? 'street-address' :
          'off'
        }
        className={cn(
          'block w-full h-11 rounded-md border bg-canvas px-3 text-base text-ink focus-visible:outline-none focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange/30 tabular',
          filled ? 'border-brand-green/40' : 'border-border',
        )}
      />
      {def.helper && <p className="text-2xs text-ink-soft mt-1">{def.helper}</p>}
    </label>
  );
}

function iconFor(t: DocFieldDef['type']) {
  switch (t) {
    case 'date': return Calendar;
    case 'name': return User;
    case 'address': return MapPin;
    case 'text':
    case 'number':
    default: return FileText;
  }
}
