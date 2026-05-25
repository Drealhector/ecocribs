import type { Metadata, Viewport } from 'next';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import { poppins, lato, plexMono, dancingScript } from '@/lib/fonts';
import { ConvexClerkProvider } from '@/components/providers/ConvexClerkProvider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.ecocribsrealty.com'),
  title: {
    default: 'EcoCribs Documentation Portal',
    template: '%s · EcoCribs',
  },
  description:
    'From payment to deed, in one elegant interface. EcoCribs Realty document workflow for Lagos property transactions.',
  applicationName: 'EcoCribs Portal',
  openGraph: {
    title: 'EcoCribs Documentation Portal',
    description: 'Track every document from receipt to deed.',
    url: 'https://portal.ecocribsrealty.com',
    siteName: 'EcoCribs',
    locale: 'en_NG',
    type: 'website',
  },
  robots: { index: false, follow: false }, // portal, not a marketing site
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        className={`${poppins.variable} ${lato.variable} ${plexMono.variable} ${dancingScript.variable}`}
        suppressHydrationWarning
      >
        <body className="min-h-dvh antialiased">
          <ConvexClerkProvider>{children}</ConvexClerkProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
