import { format, formatDistanceToNowStrict } from 'date-fns';

export function formatNGN(kobo: number, opts: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = opts;
  const naira = Math.trunc(kobo / 100);
  const k = Math.abs(kobo) % 100;
  const intPart = naira.toLocaleString('en-NG');
  const tail = k === 0 ? '' : '.' + String(k).padStart(2, '0');
  return `${withSymbol ? '₦' : ''}${intPart}${tail}`;
}

export function formatDateShort(ms: number): string {
  return format(new Date(ms), 'd MMM yyyy');
}

export function formatDateTime(ms: number): string {
  return format(new Date(ms), 'd MMM yyyy, HH:mm');
}

export function relativeTime(ms: number): string {
  return formatDistanceToNowStrict(new Date(ms), { addSuffix: true });
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
