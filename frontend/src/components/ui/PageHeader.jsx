import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/cn';

export const PageHeader = ({
  title,
  description,
  backTo,
  backLabel,
  actions,
  titleAdornment,
  printHidden = false,
  className = ''
}) => {
  return (
    <header className={cn('mb-6 md:mb-8', printHidden && 'print:hidden', className)}>
      {backTo && (
        <Link
          to={backTo}
          className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {title && (
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
                {title}
              </h1>
              {titleAdornment}
            </div>
          )}
          {description && (
            <p className="mt-1 text-sm text-ink-muted max-w-prose">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
