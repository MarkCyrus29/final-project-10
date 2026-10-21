import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Select = ({
  label,
  error,
  hint,
  id: explicitId,
  hideLabel = false,
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const isSmall = size === 'sm';

  return (
    <div className={cn(isSmall ? 'inline-block' : 'w-full')}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium text-ink',
            isSmall ? 'mb-0' : 'mb-1.5',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'block w-full appearance-none rounded-md border bg-surface pr-9 text-ink transition-colors focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:bg-surface-muted disabled:text-ink-subtle disabled:cursor-not-allowed',
            isSmall
              ? 'h-9 md:h-9 px-2.5 text-sm'
              : 'h-11 md:h-10 px-3 text-base md:text-sm',
            error ? 'border-danger' : 'border-line-strong',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-ink-subtle">
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-subtle mt-1.5">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
