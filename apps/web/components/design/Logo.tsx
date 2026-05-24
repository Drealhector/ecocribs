import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * EcoCribs logo.
 *
 * `wordmark={true}` (default) renders the official PNG downloaded from
 * ecocribsrealty.com. Pass `wordmark={false}` for an SVG reproduction that
 * scales crisper at small sizes — useful for the favicon, app icon, and
 * dense table rows. Once EcoCribs supplies an SVG, drop it in
 * `public/brand/ecocribs-logo.svg` and switch the default.
 */
export function Logo({
  className,
  tagline = 'DOCUMENTATION PORTAL',
  wordmark = true,
}: {
  className?: string;
  tagline?: string;
  wordmark?: boolean;
}) {
  if (wordmark) {
    return (
      <div className={cn('inline-flex flex-col leading-none select-none', className)}>
        <Image
          src="/brand/ecocribs-logo.png"
          alt="EcoCribs Realty"
          width={160}
          height={52}
          priority
          className="h-9 md:h-10 w-auto"
        />
        <span className="font-heading text-brand-green text-[0.55rem] md:text-[0.6rem] font-medium tracking-[0.32em] mt-1">
          {tagline}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex flex-col leading-none select-none', className)}>
      <span className="font-heading font-semibold text-[1.75rem] md:text-[2rem] tracking-tight">
        <span className="text-brand-orange">eco</span>
        <span className="text-brand-green">cribs</span>
        <span className="ml-0.5 inline-block translate-y-[-0.15em] text-brand-orange text-base">↗</span>
      </span>
      <span className="font-heading text-brand-green text-[0.6rem] md:text-[0.65rem] font-medium tracking-[0.32em] mt-0.5">
        {tagline}
      </span>
    </div>
  );
}
