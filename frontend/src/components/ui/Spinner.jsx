import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Spinner = ({ size = 16, className = '' }) => {
  return (
    <LoaderCircle
      size={size}
      className={cn('animate-spin', className)}
      aria-hidden="true"
    />
  );
};

export const PageSpinner = () => {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] items-center justify-center text-ink-subtle"
    >
      <Spinner size={20} />
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default Spinner;
