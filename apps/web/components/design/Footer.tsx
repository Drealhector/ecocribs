import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-border bg-canvas-warm">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div>
          <Logo tagline="REALTY" />
          <p className="mt-4 text-sm text-ink-soft leading-relaxed max-w-xs">
            EcoCribs Realty is your gateway to sustainable living and purposeful homes. Embrace
            change. Embrace EcoCribs.
          </p>
        </div>
        <div>
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-ink">
            Portal
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/customer-sign-in" className="hover:text-brand-green">Customer sign-in</Link></li>
            <li><Link href="/sign-in" className="hover:text-brand-green">Staff sign-in</Link></li>
            <li><Link href="/accept-invite" className="hover:text-brand-green">Accept invite</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-green">Privacy &amp; Data Rights</Link></li>
            <li><Link href="/terms" className="hover:text-brand-green">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-ink">
            EcoCribs Realty
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>10 Admiralty Rd, Lekki Phase I, Lagos</li>
            <li className="mono tabular">+234 815 714 4444</li>
            <li>help@ecocribsrealty.com</li>
            <li>
              <a className="hover:text-brand-green" href="https://ecocribsrealty.com">ecocribsrealty.com</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-ink">
            Compliance
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>RC: <span className="mono">[CAC pending]</span></li>
            <li>SCUML: <span className="mono">[Reg pending]</span></li>
            <li>NDPC DPCO: <span className="mono">[Engaged]</span></li>
            <li className="text-2xs pt-2 text-ink-soft/70">
              All documents subject to legal review.<br />
              Deed of Assignment requires wet-ink execution + Governor&apos;s consent.
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border-subtle">
        <div className="container py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-ink-soft">
          <span>&copy; {new Date().getFullYear()} EcoCribs Realty. All rights reserved.</span>
          <span>Built for Nigerian real estate. Compliant by design.</span>
        </div>
      </div>
    </footer>
  );
}
