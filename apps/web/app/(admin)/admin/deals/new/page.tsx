'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAction, useQuery } from '@/lib/convex-hooks';
import { useAuthActions } from '@/lib/auth-hooks';
import { api } from '@convex/_generated/api';
import { Card, CardContent } from '@/components/design/Card';
import { Input, Label } from '@/components/design/Input';
import { Button } from '@/components/design/Button';
import { formatNGN } from '@/lib/format';
import { ChevronLeft, Check, MessageCircle, Mail, ShieldCheck, Copy, ExternalLink, AlertTriangle } from 'lucide-react';

type Step = 'form' | 'review' | 'password' | 'sending' | 'success' | 'error';

const TITLE_TYPES = [
  { value: 'c_of_o', label: 'Certificate of Occupancy (C of O)' },
  { value: 'governors_consent', label: "Governor's Consent" },
  { value: 'excision', label: 'Excision' },
  { value: 'gazette', label: 'Gazette' },
  { value: 'registered_survey', label: 'Registered Survey' },
  { value: 'family_receipt', label: 'Family Receipt' },
] as const;

const STATES = ['Lagos', 'Delta', 'Ogun', 'FCT', 'Rivers', 'Kano'];

export default function NewDealPage() {
  const router = useRouter();
  const me = useQuery(api.users.me, {});
  const onboard = useAction(api.deals.onboardCustomer);
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    dealId: string;
    token: string;
    pin: string;
    customerName: string;
    expiresAt: number;
  } | null>(null);

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    propertyName: '',
    propertyState: 'Lagos',
    propertyLga: '',
    propertySizeSqm: '',
    propertyTitleType: 'c_of_o' as (typeof TITLE_TYPES)[number]['value'],
    purchasePriceNaira: '',
  });

  const [password, setPassword] = useState('');

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Basic validation
    if (!form.customerName.trim()) return setError('Customer name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) return setError('Enter a valid email.');
    const phoneClean = form.customerPhone.replace(/[\s\-()]/g, '');
    if (!/^(\+234|234|0)[789]\d{9}$/.test(phoneClean) && !phoneClean.startsWith('+1')) {
      return setError('Enter a valid Nigerian phone number (e.g. +2348012345678 or 08012345678).');
    }
    if (!form.propertyName.trim()) return setError('Property name is required.');
    if (!form.propertyLga.trim()) return setError('LGA is required.');
    const sqm = Number(form.propertySizeSqm);
    if (!Number.isFinite(sqm) || sqm <= 0) return setError('Property size must be a positive number.');
    const price = Number(form.purchasePriceNaira.replace(/[,\s]/g, ''));
    if (!Number.isFinite(price) || price <= 0) return setError('Purchase price must be a positive number.');
    setStep('review');
  };

  const onVerify = () => {
    setError(null);
    setStep('password');
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me?.email) return setError('Session not loaded yet — try again.');
    if (!password) return setError('Enter your password to confirm.');
    setError(null);
    setStep('sending');

    // 1. Verify the agent's password via Convex Auth (creates a fresh session,
    //    same user — harmless side effect; serves as the sudo check).
    try {
      await signIn('password', { email: me.email, password, flow: 'signIn' });
    } catch {
      setError('Password incorrect. Try again.');
      setStep('password');
      return;
    }

    // 2. Commit the onboarding atomically + queue WhatsApp/email dispatch.
    try {
      const res = await onboard({
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.toLowerCase().trim(),
        customerPhone: form.customerPhone.replace(/\s/g, ''),
        propertyName: form.propertyName.trim(),
        propertyState: form.propertyState,
        propertyLga: form.propertyLga.trim(),
        propertySizeSqm: Number(form.propertySizeSqm),
        propertyTitleType: form.propertyTitleType,
        purchasePriceKobo: Math.round(Number(form.purchasePriceNaira.replace(/[,\s]/g, '')) * 100),
      });
      setResult(res);
      setPassword('');
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not onboard customer.');
      setStep('error');
    }
  };

  const previewKobo = (() => {
    const n = Number(form.purchasePriceNaira.replace(/[,\s]/g, ''));
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  })();

  const magicLink = result
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://ecocribs-web.vercel.app'}/accept-invite?t=${result.token}`
    : '';

  return (
    <div className="container py-6 sm:py-8 max-w-2xl space-y-6">
      <Link href="/admin/deals" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Back to deals
      </Link>

      <header>
        <h1 className="font-heading text-2xl sm:text-3xl">Onboard a new customer</h1>
        <p className="text-ink-soft mt-1 text-sm">
          Add their details, review, confirm with your password — we send the link to their email
          and WhatsApp.
        </p>
      </header>

      <StepBar step={step} />

      {step === 'form' && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onFormSubmit} className="space-y-5">
              <Fieldset title="Customer">
                <Field id="customerName" label="Full name" value={form.customerName} onChange={update('customerName')} placeholder="Adaeze Nwosu" required />
                <Field id="customerEmail" label="Email (Gmail or any)" type="email" value={form.customerEmail} onChange={update('customerEmail')} placeholder="adaeze@gmail.com" required />
                <Field id="customerPhone" label="WhatsApp number" value={form.customerPhone} onChange={update('customerPhone')} placeholder="+234 801 234 5678" required helper="Include country code. This is where the magic link goes." />
              </Fieldset>

              <Fieldset title="Property">
                <Field id="propertyName" label="Property name / plot" value={form.propertyName} onChange={update('propertyName')} placeholder="Plot 14, The Pastures" required />
                <div className="grid sm:grid-cols-2 gap-4">
                  <SelectField id="propertyState" label="State" value={form.propertyState} onChange={update('propertyState')} options={STATES.map((s) => ({ value: s, label: s }))} />
                  <Field id="propertyLga" label="LGA" value={form.propertyLga} onChange={update('propertyLga')} placeholder="Epe" required />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="propertySizeSqm" label="Size (sqm)" type="number" value={form.propertySizeSqm} onChange={update('propertySizeSqm')} placeholder="600" required />
                  <SelectField id="propertyTitleType" label="Title type" value={form.propertyTitleType} onChange={update('propertyTitleType')} options={TITLE_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
                </div>
              </Fieldset>

              <Fieldset title="Transaction">
                <Field id="purchasePriceNaira" label="Purchase price (₦)" value={form.purchasePriceNaira} onChange={update('purchasePriceNaira')} placeholder="4,500,000" required helper={previewKobo > 0 ? `= ${formatNGN(previewKobo)}` : 'Numbers only, no commas needed.'} />
              </Fieldset>

              {error && (
                <p className="text-sm text-danger flex items-start gap-2" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button asChild variant="outline">
                  <Link href="/admin/deals">Cancel</Link>
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h2 className="font-heading text-xl">Verify the details</h2>
              <p className="text-sm text-ink-soft mt-1">
                The magic link goes to <span className="font-medium text-ink">{form.customerEmail}</span>
                {' '}and <span className="mono font-medium text-ink">{form.customerPhone}</span> the moment
                you confirm. Once sent, you can&apos;t edit these without contacting EcoCribs admin.
              </p>
            </div>

            <DetailGrid>
              <Detail label="Customer" value={form.customerName} />
              <Detail label="Email" value={form.customerEmail} />
              <Detail label="WhatsApp" value={form.customerPhone} mono />
              <Detail label="Property" value={form.propertyName} />
              <Detail label="State / LGA" value={`${form.propertyState} · ${form.propertyLga}`} />
              <Detail label="Size" value={`${form.propertySizeSqm} sqm`} mono />
              <Detail label="Title type" value={TITLE_TYPES.find((t) => t.value === form.propertyTitleType)?.label ?? '—'} />
              <Detail label="Purchase price" value={formatNGN(previewKobo)} mono />
            </DetailGrid>

            <div className="rounded-md border border-brand-gold/30 bg-brand-gold-soft p-3 text-sm text-ink-muted">
              <p className="font-medium text-ink flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-brand-gold" />
                What happens after you verify
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5 text-2xs">
                <li>A new deal is created in <span className="font-medium">AWAITING_PAYMENT_CONFIRMATION</span> state</li>
                <li>The customer gets a magic link via email + WhatsApp</li>
                <li>The link expires in 72 hours; one-time use only</li>
                <li>You&apos;re the assigned agent — it shows up in your pipeline</li>
              </ul>
            </div>

            {error && (
              <p className="text-sm text-danger flex items-start gap-2" role="alert">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('form')}>Edit</Button>
              <Button onClick={onVerify}>
                <ShieldCheck className="h-4 w-4" />
                Verify &amp; continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'password' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h2 className="font-heading text-xl">Confirm with your password</h2>
              <p className="text-sm text-ink-soft mt-1">
                Re-type your password to send {form.customerName}&apos;s link. Logged in as{' '}
                <span className="font-medium text-ink">{me?.email ?? '…'}</span>.
              </p>
            </div>
            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="confirm-password">Your password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-danger flex items-start gap-2" role="alert">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
                </p>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => { setError(null); setStep('review'); }}>
                  Back
                </Button>
                <Button type="submit">Send link</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'sending' && (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <div className="inline-block h-10 w-10 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" />
            <p className="mt-4 text-ink-soft text-sm">Creating deal and sending link…</p>
          </CardContent>
        </Card>
      )}

      {step === 'success' && result && (
        <Card className="border-brand-green/30">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-green text-white shrink-0">
                <Check className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div>
                <h2 className="font-heading text-xl">{result.customerName} onboarded</h2>
                <p className="text-sm text-ink-soft mt-1">
                  The system has queued the magic link for delivery via email and WhatsApp.
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-canvas-warm p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider font-medium text-ink-soft">
                Magic link (one-time copy — agent reference)
              </p>
              <div className="flex items-center gap-2 rounded-md bg-canvas border border-border-subtle px-3 py-2">
                <span className="mono text-xs truncate flex-1 text-ink-muted">{magicLink}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(magicLink)}
                  className="inline-flex items-center gap-1 text-xs text-brand-green hover:underline shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider font-medium text-ink-soft mb-1">PIN (for WhatsApp)</p>
                  <p className="mono text-2xl tabular tracking-[0.3em]">{result.pin}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-medium text-ink-soft mb-1">Expires</p>
                  <p className="text-sm">in 72 hours</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={`https://wa.me/${result && form.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${result.customerName}, your EcoCribs portal is ready. Open: ${magicLink}\n\nYour 6-digit code: ${result.pin}`)}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-green text-white text-sm font-medium px-4 py-2.5 hover:bg-brand-green-deep"
                >
                  <MessageCircle className="h-4 w-4" /> Open in WhatsApp
                </a>
                <a
                  href={`mailto:${form.customerEmail}?subject=${encodeURIComponent('Your EcoCribs portal is ready')}&body=${encodeURIComponent(`Hello ${result.customerName},\n\nYour property portal is ready. Open this link to begin:\n${magicLink}\n\nYour 6-digit code (separate from the link): ${result.pin}\n\nThis link expires in 72 hours.\n\n— EcoCribs Realty`)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-canvas text-ink text-sm font-medium px-4 py-2.5 hover:bg-canvas-warm"
                >
                  <Mail className="h-4 w-4" /> Open in email
                </a>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setForm({ customerName: '', customerEmail: '', customerPhone: '', propertyName: '', propertyState: 'Lagos', propertyLga: '', propertySizeSqm: '', propertyTitleType: 'c_of_o', purchasePriceNaira: '' });
                setResult(null);
                setError(null);
                setStep('form');
              }}>
                Onboard another
              </Button>
              <Button onClick={() => router.push(`/admin/deals/${result.dealId}`)}>
                Open this deal
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'error' && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-danger shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-xl">Something went wrong</h2>
                <p className="text-sm text-ink-soft mt-1">{error ?? 'Unknown error.'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('form')}>Edit</Button>
              <Button onClick={() => setStep('password')}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepBar({ step }: { step: Step }) {
  const steps: { key: Step | Step[]; label: string }[] = [
    { key: 'form', label: 'Details' },
    { key: ['review'], label: 'Review' },
    { key: ['password', 'sending'], label: 'Confirm' },
    { key: ['success', 'error'], label: 'Send' },
  ];
  const currentIdx = steps.findIndex((s) => (Array.isArray(s.key) ? s.key.includes(step) : s.key === step));
  return (
    <ol className="flex items-center gap-2 text-2xs sm:text-xs">
      {steps.map((s, i) => {
        const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming';
        return (
          <li key={s.label} className="flex items-center gap-2">
            <span className={`grid h-6 w-6 place-items-center rounded-full border ${state === 'done' ? 'bg-brand-green border-brand-green text-white' : state === 'current' ? 'bg-brand-orange-soft border-brand-orange text-brand-orange' : 'bg-canvas border-border text-ink-soft'}`}>
              {state === 'done' ? <Check className="h-3 w-3" /> : <span className="text-2xs font-medium">{i + 1}</span>}
            </span>
            <span className={state === 'upcoming' ? 'text-ink-soft' : 'text-ink font-medium'}>{s.label}</span>
            {i < steps.length - 1 && <span className="h-px w-4 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-heading text-sm uppercase tracking-wider text-ink-soft mb-1">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  id, label, value, onChange, placeholder, type = 'text', required, helper,
}: {
  id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; required?: boolean; helper?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} />
      {helper && <p className="text-2xs text-ink-soft mt-1.5">{helper}</p>}
    </div>
  );
}

function SelectField({
  id, label, value, onChange, options,
}: {
  id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="flex h-11 w-full rounded-md border border-border bg-canvas px-3 text-base text-ink focus-visible:outline-none focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange/30"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-3 sm:grid-cols-2 surface-inset p-4">{children}</dl>;
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className={`text-sm text-ink mt-0.5 ${mono ? 'mono tabular' : ''}`}>{value}</dd>
    </div>
  );
}
