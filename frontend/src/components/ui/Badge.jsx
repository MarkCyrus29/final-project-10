import React from 'react';
import { cn } from '../../lib/cn';

export const Badge = ({
  variant = 'neutral',
  dot = false,
  className = '',
  children,
  ...props
}) => {
  const variants = {
    neutral: 'border-line bg-surface-muted text-ink-muted',
    accent: 'border-transparent bg-accent-soft text-accent-soft-fg',
    success: 'border-success-line bg-success-soft text-success',
    warning: 'border-warning-line bg-warning-soft text-warning',
    danger: 'border-danger-line bg-danger-soft text-danger'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        variants[variant] || variants.neutral,
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, className = '' }) => {
  let variant = 'neutral';
  switch (status) {
    case 'Scheduled':
    case 'Confirmed':
      variant = 'success';
      break;
    case 'Delayed':
      variant = 'warning';
      break;
    case 'Cancelled':
      variant = 'danger';
      break;
    case 'Completed':
      variant = 'neutral';
      break;
    default:
      variant = 'neutral';
      break;
  }

  return (
    <Badge variant={variant} dot={true} className={className}>
      {status}
    </Badge>
  );
};

export default Badge;
