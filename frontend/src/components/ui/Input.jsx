import React, { useId, useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

export const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  id: explicitId,
  hideLabel = false,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'mb-1.5 block text-sm font-medium text-ink',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-subtle">
            <Icon size={16} aria-hidden="true" />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'block w-full h-11 md:h-10 rounded-md border bg-surface px-3 text-base md:text-sm text-ink placeholder:text-ink-subtle transition-colors focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:bg-surface-muted disabled:text-ink-subtle disabled:cursor-not-allowed',
            error ? 'border-danger' : 'border-line-strong',
            Icon && 'pl-9',
            className
          )}
          {...props}
        />
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
});

Input.displayName = 'Input';

export const PasswordInput = forwardRef(({
  label,
  error,
  hint,
  id: explicitId,
  hideLabel = false,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const id = explicitId || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'mb-1.5 block text-sm font-medium text-ink',
            hideLabel && 'sr-only'
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={showPassword ? 'text' : 'password'}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'block w-full h-11 md:h-10 rounded-md border bg-surface px-3 pr-11 text-base md:text-sm text-ink placeholder:text-ink-subtle transition-colors focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent disabled:bg-surface-muted disabled:text-ink-subtle disabled:cursor-not-allowed',
            error ? 'border-danger' : 'border-line-strong',
            className
          )}
          {...props}
        />
        <div className="absolute inset-y-0 right-1 flex items-center">
          <IconButton
            type="button"
            icon={showPassword ? EyeOff : Eye}
            label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((prev) => !prev)}
          />
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
});

PasswordInput.displayName = 'PasswordInput';

export default Input;
