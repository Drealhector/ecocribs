/**
 * Brand tokens mirrored on the client for inline styles, SVG colours, and
 * places Tailwind classes don't reach (e.g. canvas / signature pad strokes).
 *
 * Source of truth is tailwind.config.ts. Keep in sync.
 */
export const BRAND = {
  orange: '#F3860D',
  orangeHover: '#FD8200',
  orangeSoft: '#FEF1E0',
  green: '#386546',
  greenDeep: '#365443',
  greenSoft: '#E8EFEA',
  navy: '#042551',
  gold: '#C9A227',
  goldSoft: '#FBF5DE',
  ink: '#111111',
  inkMuted: '#494C4F',
  inkSoft: '#787777',
  canvas: '#FFFFFF',
  canvasWarm: '#F9F7F3',
  border: '#E0E0E0',
  danger: '#B3261E',
} as const;

export const BRAND_NAME = 'EcoCribs';
export const BRAND_TAGLINE = 'Documentation Portal';
export const BRAND_VOICE = {
  hero: 'Beautiful. That’s your home, secured.',
  subHero: 'Track every document from receipt to deed. One portal, every signature, zero confusion.',
} as const;
