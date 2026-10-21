import React from 'react';
import { cn } from '../../lib/cn';

export const Card = ({
  as: Tag = 'div',
  padded = true,
  className = '',
  children,
  ...props
}) => {
  return (
    <Tag
      className={cn(
        'rounded-lg border border-line bg-surface',
        padded && 'p-4 md:p-6',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};

export const CardTitle = ({
  as: Tag = 'h2',
  className = '',
  children,
  ...props
}) => {
  return (
    <Tag
      className={cn('text-base font-semibold text-ink', className)}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Card;
