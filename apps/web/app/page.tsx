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
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-canvas-warm pattern-vine">
          <div className="container relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24 xl:py-28 items-center">
            <div className="space-y-5 sm:space-y-6 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-pill bg-brand-green-soft px-3 py-1 text-2xs sm:text-xs font-medium uppercase tracking-wider text-brand-green">
                <Leaf className="h-3.5 w-3.5" />
                EcoCribs Realty &times; Documentation Portal
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.05]">
                Beautiful.<br />
                That&apos;s your home,<br />
                <span className="text-brand-green">secured.</span>
              </h1>
              <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
                Track every document from receipt to deed. One portal, every signature, zero
                confusion. Built for Lagos. Compliant by design.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/customer-sign-in">Customer sign in</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/sign-in">Staff sign in</Link>
                </Button>
              </div>
            </div>

            <Card className="shadow-card max-w-md w-full mx-auto lg:mx-0 lg:ml-auto">
              <CardContent className="pt-6">
                <p className="text-2xs sm:text-xs uppercase tracking-wider font-medium text-ink-soft mb-3">
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

        {/* Pillars */}
        <section className="border-b border-border">
          <div className="container py-12 sm:py-16 lg:py-20 grid gap-8 sm:gap-10 md:grid-cols-3">
            <Pillar
              icon={<FileSignature className="h-6 w-6" />}
              title="Sign anywhere"
              body="Receipt, offer, contract, deed — all signable on phone or laptop. No printing, no scanning."
            />
            <Pillar
              icon={<MessageCircle className="h-6 w-6" />}
              title="WhatsApp first"
              body="Magic links and reminders arrive where your clients actually answer. No more chasing signatures across email threads."
            />
            <Pillar
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Always in sync"
              body="Both sides see the same progress, the same documents, the same status. No more 'did you get my offer?'"
            />
          </div>
        </section>

        <section className="bg-brand-green text-white">
          <div className="container py-12 sm:py-16 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl leading-tight">
                Redefining how Nigerians close on a home.
              </h2>
              <p className="mt-4 text-white/85 leading-relaxed text-sm sm:text-base">
                Replace WhatsApp threads, paper receipts, and Google Sheets with one elegant
                interface that lives under the EcoCribs brand.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
                <Button asChild size="lg" variant="primary" className="w-full sm:w-auto">
                  <Link href="/customer-sign-in">Customer sign in</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link href="/sign-in">Staff sign in</Link>
                </Button>
              </div>
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
