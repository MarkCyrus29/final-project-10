import React from 'react';
import { cn } from '../../lib/cn';

export const SegmentedControl = ({
  options = [],
  value,
  onChange,
  ariaLabel = 'Filter options',
  className = ''
}) => {
  // Normalise options — accept plain strings or { value, label } objects
  const normalised = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex max-w-full overflow-x-auto rounded-md border border-line bg-surface-muted p-0.5',
        className
      )}
    >
      {normalised.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange?.(option.value)}
            className={cn(
              'h-9 md:h-8 shrink-0 rounded-md px-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-surface text-ink border border-line'
                : 'text-ink-muted hover:text-ink border border-transparent'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;

