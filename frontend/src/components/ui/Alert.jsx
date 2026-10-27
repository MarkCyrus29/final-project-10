import React from 'react';
import { CircleAlert, CircleCheck, TriangleAlert, Info } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Alert = ({
  variant = 'info',
  className = '',
  children,
  ...props
}) => {
  const dangerConfig = {
    classes: 'border-danger-line bg-danger-soft text-danger',
    icon: CircleAlert,
    role: 'alert'
  };

  const configs = {
    danger: dangerConfig,
    error: dangerConfig,
    success: {
      classes: 'border-success-line bg-success-soft text-success',
      icon: CircleCheck,
      role: 'status'
    },
    warning: {
      classes: 'border-warning-line bg-warning-soft text-warning',
      icon: TriangleAlert,
      role: 'status'
    },
    info: {
      classes: 'border-line bg-surface-muted text-ink-muted',
      icon: Info,
      role: 'status'
    }
  };

  const current = configs[variant] || configs.info;
  const Icon = current.icon;

  return (
    <div
      role={current.role}
      className={cn(
        'flex items-start gap-3 rounded-md border p-3 text-sm',
        current.classes,
        className
      )}
      {...props}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default Alert;
