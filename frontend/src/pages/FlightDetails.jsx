import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, formatDate, formatTime, formatDuration } from '../lib/format';
import { Button, ButtonLink } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
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

  const isBookable = flight.status === 'Scheduled' && flight.availableSeats > 0;

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
            <Badge variant="neutral">{flight.seatClass || 'Economy'}</Badge>
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
            <dt className="text-xs text-ink-muted">Cabin class</dt>
            <dd className="text-lg font-semibold text-ink mt-0.5">
              {flight.seatClass || 'Economy'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Flight status</dt>
            <dd className="text-lg font-semibold text-ink mt-0.5">
              {flight.status}
            </dd>
          </div>
        </dl>

        {/* Action row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div>
            <span className="text-xs text-ink-muted block">Base price per passenger</span>
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
