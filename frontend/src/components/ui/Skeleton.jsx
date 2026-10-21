import React from 'react';
import { cn } from '../../lib/cn';

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-muted', className)}
    />
  );
};

export const FlightCardSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="rounded-lg border border-line bg-surface p-4 md:p-5"
    >
      {/* Top bar: flight number and status pill */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Route: origin, line, destination */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="mt-1.5 h-4 w-24" />
          <Skeleton className="mt-1.5 h-4 w-16" />
        </div>
        <div className="flex w-20 sm:w-28 flex-col items-center">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="my-1.5 h-px w-full" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="text-right flex flex-col items-end">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="mt-1.5 h-4 w-24" />
          <Skeleton className="mt-1.5 h-4 w-16" />
        </div>
      </div>

      {/* Footer: date, seats, price */}
      <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-1.5 h-4 w-32" />
        </div>
        <div className="text-right flex flex-col items-end">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="mt-1 h-6 w-20" />
        </div>
      </div>
    </div>
  );
};

export const ListItemSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="rounded-lg border border-line bg-surface p-4 md:p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="rounded-lg border border-line bg-surface overflow-hidden"
    >
      <div className="border-b border-line bg-surface-muted/50 p-4">
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="divide-y divide-line p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
};

export const DetailSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="rounded-lg border border-line bg-surface divide-y divide-line"
    >
      <div className="p-4 md:p-6 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="p-4 md:p-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div>
          <Skeleton className="h-4 w-12" />
          <Skeleton className="mt-2 h-10 w-24" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-col items-end">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="mt-2 h-10 w-24" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
      </div>
      <div className="p-4 md:p-6 grid grid-cols-3 gap-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
};

export default Skeleton;
