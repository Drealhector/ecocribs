import type { Config } from 'tailwindcss';

/**
 * EcoCribs brand tokens.
 *
 * Sourced from the live ecocribsrealty.com brand audit:
 *   - Primary orange #F3860D (CTAs, action) + #FD8200 hover
 *   - Forest green #386546 (sustainability, status, success) + #365443 deep
 *   - Warm gold #C9A227 (PRD-specified accent — "Awaiting" states)
 *   - Neutral warm off-white #F9F7F3
 *   - Poppins headings, Lato body, IBM Plex Mono for IDs/timestamps
 *
 * Avoids generic SaaS violet/fuchsia/cyan gradients (per user preference).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        brand: {
          orange: { DEFAULT: '#F3860D', hover: '#FD8200', soft: '#FEF1E0' },
          green: { DEFAULT: '#386546', deep: '#365443', soft: '#E8EFEA' },
          navy: { DEFAULT: '#042551' },
          gold: { DEFAULT: '#C9A227', soft: '#FBF5DE' },
        },
        ink: {
          DEFAULT: '#111111',
          muted: '#494C4F',
          soft: '#787777',
        },
        canvas: {
          DEFAULT: '#FFFFFF',
          warm: '#F9F7F3',
          subtle: '#FAFAFA',
        },
        border: {
          DEFAULT: '#E0E0E0',
          subtle: '#F0EFEC',
        },
        success: '#386546',
        danger: '#B3261E',
        warning: '#C9A227',
        info: '#042551',
      },
      fontFamily: {
        sans: ['var(--font-lato)', 'Lato', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        script: ['var(--font-script)', '"Dancing Script"', 'cursive'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        none: '0',
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(17,17,17,0.05), 0 1px 1px rgba(17,17,17,0.03)',
        card: '0 4px 12px rgba(17,17,17,0.06), 0 1px 3px rgba(17,17,17,0.04)',
        lift: '0 16px 32px -8px rgba(17,17,17,0.10), 0 4px 8px rgba(17,17,17,0.05)',
        focus: '0 0 0 3px rgba(243,134,13,0.30)',
      },
      keyframes: {
        'grow-vine': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'grow-vine': 'grow-vine 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
