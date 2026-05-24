import Link from 'next/link';
import { ArrowRight, MessageCircle, User2, Briefcase } from 'lucide-react';
import { Nav } from '@/components/design/Nav';
import { Footer } from '@/components/design/Footer';

export default function Landing() {
  return (
    <>
      <Nav />

      <main className="bg-canvas-warm pattern-vine">
        <div className="container py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12">
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-brand-green font-medium mb-3">
              EcoCribs Documentation Portal
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.1]">
              Your property documents, one place.
            </h1>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            <EntryCard
              href="/customer-sign-in"
              icon={<User2 className="h-6 w-6" />}
              eyebrow="Customer"
              title="View your property"
              body="Open your receipt, sign your offer, contract, and deed. Track every stage in one place."
              cta="Customer sign in"
              accent="orange"
            />
            <EntryCard
              href="/sign-in"
              icon={<Briefcase className="h-6 w-6" />}
              eyebrow="EcoCribs Staff"
              title="Manage transactions"
              body="Onboard new customers, send documents for signature, track every deal in your pipeline."
              cta="Staff sign in"
              accent="green"
            />
          </div>

          <div className="mt-10 sm:mt-12 max-w-md mx-auto text-center">
            <Link
              href="/accept-invite"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-canvas px-4 py-3 text-sm text-ink-muted hover:bg-canvas-warm hover:text-ink hover:border-brand-green transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-brand-green" />
              <span>
                First time? <span className="font-medium text-ink">Use the link from your agent</span>
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function EntryCard({
  href, icon, eyebrow, title, body, cta, accent,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  accent: 'orange' | 'green';
}) {
  const iconBg = accent === 'orange' ? 'bg-brand-orange-soft text-brand-orange' : 'bg-brand-green-soft text-brand-green';
  const ctaCls = accent === 'orange'
    ? 'bg-brand-orange text-white hover:bg-brand-orange-hover'
    : 'bg-brand-green text-white hover:bg-brand-green-deep';
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-border bg-canvas p-6 sm:p-7 shadow-soft hover:shadow-card hover:border-ink/20 transition-all"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className={`grid h-12 w-12 place-items-center rounded-md shrink-0 ${iconBg}`}>
          {icon}
        </span>
        <span className="text-2xs uppercase tracking-wider font-medium text-ink-soft">{eyebrow}</span>
      </div>
      <h2 className="font-heading text-xl sm:text-2xl text-ink">{title}</h2>
      <p className="mt-2 text-sm sm:text-[0.95rem] text-ink-muted leading-relaxed">{body}</p>
      <span className={`mt-5 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${ctaCls}`}>
        {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
