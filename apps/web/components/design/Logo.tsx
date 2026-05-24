import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * EcoCribs logo.
 *
 * `compact` = no tagline, tighter sizing (good for nav)
 * default  = wordmark image + small tagline below (good for sign-in pages, footer)
 */
export function Logo({
  className,
  tagline = 'DOCUMENTATION PORTAL',
  compact = false,
}: {
  className?: string;
  tagline?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('inline-flex flex-col leading-none select-none', className)}>
      <Image
        src="/brand/ecocribs-logo.png"
        alt="EcoCribs Realty"
        width={160}
        height={52}
        priority
        className={cn(
          'w-auto',
          compact ? 'h-7 md:h-8' : 'h-8 md:h-10',
        )}
      />
      {!compact && tagline && (
        <span className="font-heading text-brand-green text-[0.55rem] md:text-[0.6rem] font-medium tracking-[0.32em] mt-1">
          {tagline}
        </span>
      )}
    </div>
  );
}
