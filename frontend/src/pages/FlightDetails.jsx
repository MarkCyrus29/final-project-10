import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, formatDate, formatTime, formatDuration } from '../lib/format';
import { CABIN_CLASSES, calculateTotalPrice } from '../lib/pricing';
import { Button, ButtonLink } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { DetailSkeleton } from '../components/ui/Skeleton';

const FlightDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(
    flight
      ? `${flight.flightNumber} · ${flight.origin.code} to ${flight.destination.code}`
      : 'Flight details'
  );

  useEffect(() => {
    const fetchFlight = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/flights/${id}`);
        setFlight(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch flight details');
      } finally {
        setLoading(false);
      }
    };

    fetchFlight();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          icon={AlertCircle}
          title="Flight not found"
          description={error || 'Unable to locate flight with this ID.'}
          action={
            <ButtonLink to="/flights" variant="secondary">
              Back to flights
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const isDeparted = flight.departureTime ? new Date(flight.departureTime) <= new Date() : false;
  const isBookable = flight.status === 'Scheduled' && flight.availableSeats > 0 && !isDeparted;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <ButtonLink to="/flights" variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to flights
        </ButtonLink>
      </div>

      <Card className="p-6 sm:p-8 space-y-8">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold tracking-tight text-ink">
              {flight.flightNumber}
            </span>
            <StatusBadge status={flight.status} />
          </div>
          <span className="text-sm text-ink-muted">
            {formatDate(flight.departureTime)}
          </span>
        </div>

        {/* Route breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
          <div className="text-left md:text-center">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Departure</span>
            <div className="text-3xl font-bold tracking-tight text-ink mt-1 font-mono">
              {flight.origin.code}
            </div>
            <div className="text-sm text-ink-muted">{flight.origin.city}</div>
            <div className="text-base font-semibold text-accent mt-1">
              {formatTime(flight.departureTime)}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-mono text-ink-muted">
              {formatDuration(flight.departureTime, flight.arrivalTime)}
            </span>
            <div className="w-full flex items-center justify-center my-2 max-w-[160px]">
              <div className="h-px bg-line-strong w-full relative">
                <ArrowRight className="w-4 h-4 text-ink-muted absolute -top-2 left-1/2 -translate-x-1/2 bg-surface px-0.5" />
              </div>
            </div>
            <span className="text-xs text-ink-muted">Non-stop</span>
          </div>

          <div className="text-left md:text-center">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Arrival</span>
            <div className="text-3xl font-bold tracking-tight text-ink mt-1 font-mono">
              {flight.destination.code}
            </div>
            <div className="text-sm text-ink-muted">{flight.destination.city}</div>
            <div className="text-base font-semibold text-accent mt-1">
              {formatTime(flight.arrivalTime)}
            </div>
          </div>
        </div>

        {/* Facts grid */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-line">
          <div>
            <dt className="text-xs text-ink-muted">Base fare</dt>
            <dd className="text-lg font-bold font-mono text-ink mt-0.5">
              {formatPrice(flight.basePrice)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Available seats</dt>
            <dd className="text-lg font-semibold text-ink mt-0.5">
              {flight.availableSeats} of {flight.totalSeats}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Duration</dt>
            <dd className="text-lg font-semibold text-ink mt-0.5">
              {formatDuration(flight.departureTime, flight.arrivalTime)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Flight status</dt>
            <dd className="text-lg font-semibold text-ink mt-0.5">
              {flight.status}
            </dd>
          </div>
        </dl>

        {/* Cabin class pricing, all derived from the base fare */}
        <section aria-labelledby="cabin-pricing-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h2 id="cabin-pricing-heading" className="text-sm font-semibold text-ink">
              Cabin classes
            </h2>
            <span className="text-xs text-ink-muted">Price per passenger</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CABIN_CLASSES.map((cabin) => (
              <div
                key={cabin.name}
                tabIndex={0}
                className="rounded-lg border border-line bg-canvas p-4 transition-all duration-150 hover:border-accent hover:bg-accent/5 hover:-translate-y-0.5 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent"
              >
                <div className="text-sm font-medium text-ink">{cabin.name}</div>
                <div className="mt-1 text-xl font-bold font-mono text-ink">
                  {formatPrice(calculateTotalPrice(flight.basePrice, cabin.name, 1))}
                </div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {cabin.multiplier === 1 ? 'Base fare' : `${cabin.multiplier}× base fare`}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div>
            <span className="text-xs text-ink-muted block">Starting from, per passenger</span>
            <span className="text-2xl font-bold font-mono text-accent">
              {formatPrice(flight.basePrice)}
            </span>
          </div>

          <div className="w-full sm:w-auto">
            {!user && (
              <Button onClick={() => navigate('/login')} variant="primary" size="lg" className="w-full sm:w-auto">
                Sign in to book
              </Button>
            )}

            {user && user.role === 'passenger' && (
              isBookable ? (
                <ButtonLink to={`/book/${flight._id}`} variant="primary" size="lg" className="w-full sm:w-auto">
                  Book this flight
                </ButtonLink>
              ) : (
                <Button disabled size="lg" className="w-full sm:w-auto">
                  {flight.status !== 'Scheduled'
                    ? `Flight is ${flight.status.toLowerCase()}`
                    : isDeparted
                    ? 'Flight has departed'
                    : 'Sold out'}
                </Button>
              )
            )}

            {user && user.role === 'admin' && (
              <Alert variant="info" className="text-xs">
                Admin mode: booking is restricted to passenger accounts.
              </Alert>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FlightDetails;
