import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-border bg-canvas-warm">
      <div className="container py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo tagline="REALTY" />
          <p className="mt-4 text-sm text-ink-soft leading-relaxed max-w-xs">
            Your gateway to sustainable living and purposeful homes in Lagos and beyond.
          </p>
        </div>
        <div>
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-ink">
            Portal
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/customer-sign-in" className="hover:text-brand-green">Customer sign in</Link></li>
            <li><Link href="/accept-invite" className="hover:text-brand-green">Accept invite</Link></li>
            <li><Link href="/sign-in" className="hover:text-brand-green">Staff sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-ink">
            Need a hand?
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>
              <a href="https://wa.me/2348157144444" className="hover:text-brand-green inline-flex items-center gap-2">
                WhatsApp <span className="mono tabular">+234 815 714 4444</span>
              </a>
            </li>
            <li>
              <a href="mailto:help@ecocribsrealty.com" className="hover:text-brand-green">
                help@ecocribsrealty.com
              </a>
            </li>
            <li className="text-2xs text-ink-soft/80 pt-1">
              10 Admiralty Rd, Lekki Phase I, Lagos
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border-subtle">
        <div className="container py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-ink-soft">
          <span>&copy; {new Date().getFullYear()} EcoCribs Realty. All rights reserved.</span>
          <a href="https://ecocribsrealty.com" className="hover:text-brand-green">ecocribsrealty.com</a>
        </div>
      </div>
    </footer>
  );
}
