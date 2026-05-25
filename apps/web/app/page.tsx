import Link from 'next/link';
import { FileText, MessageCircle, BellRing } from 'lucide-react';
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
        {/* Hero — speaks to the customer, not about the company */}
        <section className="relative overflow-hidden border-b border-border bg-canvas-warm pattern-vine">
          <div className="container relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24 xl:py-28 items-center">
            <div className="space-y-5 sm:space-y-6 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-pill bg-brand-green-soft px-3 py-1 text-2xs sm:text-xs font-medium uppercase tracking-wider text-brand-green">
                EcoCribs Documentation Portal
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-ink leading-[1.05]">
                Your home,<br />
                paperwork and all,<br />
                <span className="text-brand-green">in one place.</span>
              </h1>
              <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
                Open your receipt, sign your offer, follow every stage to the deed. No printing,
                no scanning, no chasing — all from your phone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/customer-sign-in">Customer sign in</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/accept-invite">I have an invite</Link>
                </Button>
              </div>
              <p className="text-xs text-ink-soft pt-2">
                Want to earn referral commission?{' '}
                <Link href="/become-an-agent" className="text-brand-green underline font-medium">
                  Become an agent
                </Link>
              </p>
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

        {/* Three customer benefits */}
        <section className="border-b border-border">
          <div className="container py-12 sm:py-16 lg:py-20 grid gap-8 sm:gap-10 md:grid-cols-3">
            <Pillar
              icon={<FileText className="h-6 w-6" />}
              title="Every document, one place"
              body="Receipt, offer letter, contract of sale, survey plan, deed — all neatly organised. Open anytime, on any device."
            />
            <Pillar
              icon={<MessageCircle className="h-6 w-6" />}
              title="Sign from WhatsApp"
              body="The link comes straight to your phone. Tap, sign with your finger, you're done. No printing, no scanning."
            />
            <Pillar
              icon={<BellRing className="h-6 w-6" />}
              title="Always know what's next"
              body="See exactly which stage you're at and what's coming. Friendly reminders so nothing stalls."
            />
          </div>
        </section>

        {/* Reassuring close — addressed to the customer, light touch */}
        <section className="bg-brand-green text-white">
          <div className="container py-12 sm:py-16 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl leading-tight">
                From payment to deed,<br className="hidden sm:block" /> the whole journey in your pocket.
              </h2>
              <p className="mt-4 text-white/85 leading-relaxed text-sm sm:text-base">
                EcoCribs sends you the link. You sign on your phone. Everyone sees the same status.
                No more &ldquo;did you get my offer?&rdquo;
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
                <Button asChild size="lg" variant="primary" className="w-full sm:w-auto">
                  <Link href="/customer-sign-in">Open my portal</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link href="/accept-invite">I have an invite</Link>
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
