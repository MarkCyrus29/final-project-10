import React from 'react';
import { cn } from '../../lib/cn';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface px-6 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-ink-subtle">
          <Icon size={20} aria-hidden="true" />
        </div>
      )}
      {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
