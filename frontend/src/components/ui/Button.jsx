import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

export const buttonClasses = ({ variant = 'primary', size = 'md', className = '' } = {}) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    md: 'h-11 px-4 md:h-10',
    sm: 'h-9 px-3'
  };

  const variants = {
    primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
    secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
    ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
    danger: 'bg-danger-solid text-danger-solid-fg hover:bg-danger-solid-hover',
    'danger-subtle': 'text-danger hover:bg-danger-soft'
  };

  return cn(base, sizes[size] || sizes.md, variants[variant] || variants.primary, className);
};

export const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  disabled,
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      {...props}
    >
      {loading ? (
        <Spinner size={16} />
      ) : Icon ? (
        <Icon size={16} aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export const ButtonLink = ({
  to,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  children,
  ...props
}) => {
  return (
    <Link
      to={to}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </Link>
  );
};

export const IconButton = ({
  icon: Icon,
  label,
  className = '',
  children,
  ...props
}) => {
  const content = Icon ? <Icon size={16} aria-hidden="true" /> : children;
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'h-9 w-9 inline-flex items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
