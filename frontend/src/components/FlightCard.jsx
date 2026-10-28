import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { StatusBadge } from './ui/Badge';
import { formatDate, formatTime, formatDuration, formatPrice } from '../lib/format';

export const FlightCard = ({ flight }) => {
  const durationText = formatDuration(flight.departureTime, flight.arrivalTime);
  const isAvailable = flight.availableSeats > 0;

  return (
    <Link
      to={`/flights/${flight._id}`}
      className="block rounded-lg border border-line bg-surface p-4 md:p-5 transition-colors hover:border-line-strong"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-ink-muted">
            {flight.flightNumber}
          </span>
        </div>
        <StatusBadge status={flight.status} />
      </div>

      {/* 2. Route */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Origin block */}
        <div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-ink">
            {flight.origin?.code}
          </div>
          <div className="text-sm text-ink-muted">
            {flight.origin?.city}
          </div>
          <div className="text-sm tabular-nums text-ink-muted mt-1">
            {formatTime(flight.departureTime)}
          </div>
        </div>

        {/* Center column */}
        <div className="flex w-20 flex-col items-center sm:w-28">
          <span className="text-xs text-ink-subtle">{durationText}</span>
          <div className="relative my-1.5 h-px w-full bg-line-strong">
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-line-strong"
              aria-hidden="true"
            />
            <span
              className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full border border-line-strong bg-surface"
              aria-hidden="true"
            />
          </div>
          <span className="text-xs text-ink-subtle">Non-stop</span>
        </div>

        {/* Destination block */}
        <div className="text-right">
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-ink">
            {flight.destination?.code}
          </div>
          <div className="text-sm text-ink-muted">
            {flight.destination?.city}
          </div>
          <div className="text-sm tabular-nums text-ink-muted mt-1">
            {formatTime(flight.arrivalTime)}
          </div>
        </div>
      </div>

      {/* 3. Footer */}
      <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-ink-muted">
            <CalendarDays size={14} className="text-ink-subtle" aria-hidden="true" />
            <span>{formatDate(flight.departureTime)}</span>
          </div>
          <div className="text-sm mt-1">
            {isAvailable ? (
              <span className="text-success tabular-nums">
                {flight.availableSeats} of {flight.totalSeats} seats left
              </span>
            ) : (
              <span className="text-danger font-medium">Sold out</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-ink-subtle block">From</span>
          <span className="text-lg font-semibold tabular-nums text-ink">
            {formatPrice(flight.basePrice)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default FlightCard;
