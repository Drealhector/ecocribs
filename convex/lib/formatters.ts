/**
 * Money. All amounts are stored as **kobo** (₦1 = 100 kobo). Floats forbidden.
 */
export function formatNGN(kobo: number, opts: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = opts;
  const naira = Math.trunc(kobo / 100);
  const k = Math.abs(kobo) % 100;
  const intPart = naira.toLocaleString('en-NG');
  const tail = k === 0 ? '' : '.' + String(k).padStart(2, '0');
  return `${withSymbol ? '₦' : ''}${intPart}${tail}`;
}

/**
 * PRD status vocabulary — surfaces directly to the user, so it must match.
 * Server-side state names are SCREAMING_SNAKE; UI labels are Title Case.
 */
export const STATUS_LABEL: Record<string, string> = {
  AWAITING_PAYMENT_CONFIRMATION: 'Awaiting EcoCribs',
  RECEIPT_SENT: 'Receipt Issued',
  OFFER_LETTER_AWAITING_CLIENT: 'Awaiting Client',
  OFFER_DECLINED: 'Declined',
  CONTRACT_AWAITING_CLIENT: 'Awaiting Client',
  CONTRACT_AWAITING_WITNESS: 'Awaiting Witness',
  CONTRACT_SIGNED: 'Signed',
  SURVEY_ISSUED: 'Survey Issued',
  DEED_AWAITING_CLIENT: 'Awaiting Client',
  DEED_AWAITING_WET_INK: 'Awaiting EcoCribs',
  DEED_AWAITING_WITNESS: 'Awaiting Witness',
  DEED_SIGNED: 'Signed',
  AWAITING_GOVERNORS_CONSENT: "Awaiting Governor's Consent",
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const STAGES = [
  { key: 'payment', label: 'Payment Confirmation', terminalState: 'RECEIPT_SENT' },
  { key: 'offer', label: 'Offer Letter', terminalState: 'OFFER_LETTER_AWAITING_CLIENT' },
  { key: 'contract', label: 'Contract of Sale', terminalState: 'CONTRACT_SIGNED' },
  { key: 'survey', label: 'Survey Plan', terminalState: 'SURVEY_ISSUED' },
  { key: 'deed', label: 'Deed of Assignment', terminalState: 'COMPLETED' },
] as const;

export function stageFromState(state: string): (typeof STAGES)[number]['key'] | null {
  if (state === 'AWAITING_PAYMENT_CONFIRMATION' || state === 'RECEIPT_SENT') return 'payment';
  if (state.startsWith('OFFER_')) return 'offer';
  if (state.startsWith('CONTRACT_')) return 'contract';
  if (state === 'SURVEY_ISSUED') return 'survey';
  if (state.startsWith('DEED_') || state === 'AWAITING_GOVERNORS_CONSENT') return 'deed';
  if (state === 'COMPLETED' || state === 'ARCHIVED') return 'deed';
  return null;
}
