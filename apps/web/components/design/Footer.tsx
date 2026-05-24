import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-border bg-canvas">
      <div className="container py-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="EcoCribs home">
          <Logo />
        </Link>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-ink-muted">
          <a className="hover:text-brand-green" href="mailto:help@ecocribsrealty.com">
            help@ecocribsrealty.com
          </a>
          <a className="hover:text-brand-green mono tabular" href="https://wa.me/2348157144444">
            +234 815 714 4444
          </a>
        </div>
      </div>
      <div className="border-t border-border-subtle">
        <div className="container py-3 text-xs text-ink-soft">
          &copy; {new Date().getFullYear()} EcoCribs Realty
        </div>
      </div>
    </footer>
  );
}
