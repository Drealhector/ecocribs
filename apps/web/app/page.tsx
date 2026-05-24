import Link from 'next/link';
import { FileSignature, ShieldCheck, MessageCircle, Leaf } from 'lucide-react';
import { Nav } from '@/components/design/Nav';
import { Footer } from '@/components/design/Footer';
import { Button } from '@/components/design/Button';
import { Card, CardContent } from '@/components/design/Card';
import { ProgressTree } from '@/components/progress-tree/ProgressTree';

export default function Landing() {
  return (
    <>
      <Nav />

      <main>
        {/* Hero — orange CTA, green accents, no SaaS gradient */}
        <section className="relative overflow-hidden border-b border-border bg-canvas-warm pattern-vine">
          <div className="container relative grid gap-12 py-16 md:grid-cols-2 md:py-24 lg:py-28 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-pill bg-brand-green-soft px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-green">
                <Leaf className="h-3.5 w-3.5" />
                EcoCribs Realty &times; Documentation Portal
              </span>
              <h1 className="font-heading text-5xl lg:text-6xl text-ink leading-[1.05]">
                Beautiful.<br />
                That&apos;s your home,<br />
                <span className="text-brand-green">secured.</span>
              </h1>
              <p className="text-lg text-ink-muted max-w-md leading-relaxed">
                Track every document from receipt to deed. One portal, every signature, zero
                confusion. Built for Lagos. Compliant by design.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href="/customer-sign-in">Customer sign-in</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-in">Staff sign-in</Link>
                </Button>
              </div>
              <p className="text-xs text-ink-soft pt-3 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                NDPA-aligned · SCUML-ready · Evidence Act s.84 audit trail
              </p>
            </div>

            <Card className="shadow-card p-2 md:p-3">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider font-medium text-ink-soft mb-2">
                  Your progress · Plot 27, Glory Land Estate, Epe
                </p>
                <ProgressTree
                  currentStage="contract"
                  completedStages={['payment', 'offer']}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Three pillars — mirrors the live site's BUILD/BUY/SELL but tailored to the portal value prop */}
        <section className="border-b border-border">
          <div className="container py-16 md:py-20 grid gap-8 md:grid-cols-3">
            <Pillar
              icon={<FileSignature className="h-6 w-6" />}
              title="Sign with confidence"
              body="Every signature captures IP, time, geo, device fingerprint, and a SHA-256 of the signed PDF — an Evidence Act s.84 audit trail, generated automatically."
            />
            <Pillar
              icon={<MessageCircle className="h-6 w-6" />}
              title="WhatsApp-first"
              body="Magic links and reminders arrive where your clients actually answer. 24-hour gentle nudge, 72-hour escalation, 7-day admin alert — no transaction stalls."
            />
            <Pillar
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Wet-ink-aware"
              body="The portal knows that Deeds of Assignment require wet ink + Governor's consent in Lagos. It guides the hybrid flow instead of pretending the digital signature is final."
            />
          </div>
        </section>

        <section className="bg-brand-green text-white">
          <div className="container py-16 text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl">Redefining how Nigerians close on a home.</h2>
            <p className="mt-4 text-white/85 leading-relaxed">
              Replace WhatsApp threads, paper receipts, and Google Sheets with one elegant interface
              that lives under the EcoCribs brand.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" variant="primary">
                <Link href="/customer-sign-in">Customer sign-in</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Link href="/sign-in">Staff sign-in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Pillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-brand-orange-soft text-brand-orange">
        {icon}
      </span>
      <h3 className="font-heading text-xl mt-4">{title}</h3>
      <p className="mt-2 text-ink-muted leading-relaxed">{body}</p>
    </div>
  );
}
