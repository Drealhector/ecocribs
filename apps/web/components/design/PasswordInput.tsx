'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from './Input';
import { cn } from '@/lib/utils';

/**
 * Password input with a click-to-reveal eye icon.
 *
 *   <PasswordInput id="password" value={pw} onChange={...} required />
 *
 * Use anywhere we'd otherwise use <Input type="password" /> — same API
 * but adds the toggle on the right side.
 */
export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-11', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:text-ink hover:bg-canvas-warm transition-colors"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
