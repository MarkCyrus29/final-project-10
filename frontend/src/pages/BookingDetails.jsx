import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { formatPrice, formatDate, formatTime, formatDuration, plural } from '../lib/format';
import { Button, ButtonLink } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { DetailSkeleton } from '../components/ui/Skeleton';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  useDocumentTitle(booking ? `Booking · ${booking.bookingReference}` : 'Booking details');

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/bookings/${id}`);
        setBooking(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    const ok = await confirm({
      title: 'Cancel reservation',
      description: `Are you sure you want to cancel booking ${booking.bookingReference}? Your seats will be released.`,
      confirmText: 'Cancel reservation',
      variant: 'danger'
    });

    if (!ok) return;

    setCancelling(true);
    try {
      await api.delete(`/api/bookings/${id}`);
      setBooking((prev) => ({ ...prev, status: 'Cancelled' }));
      toast.success('Reservation cancelled.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !booking) {
    const returnPath = user?.role === 'admin' ? '/admin' : '/my-bookings';
    const returnLabel = user?.role === 'admin' ? 'Admin dashboard' : 'My bookings';
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          icon={AlertCircle}
          title="Booking access error"
          description={error || 'Booking could not be found.'}
          action={
            <ButtonLink to={returnPath} variant="secondary">
              Return to {returnLabel}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const flight = booking.flight || {};
  const isOwner = user && booking.user && (booking.user._id === user._id || booking.user === user._id);
  const returnPath = user?.role === 'admin' ? '/admin/bookings' : '/my-bookings';
  const returnLabel = user?.role === 'admin' ? 'All bookings' : 'My bookings';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ButtonLink to={returnPath} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Return to {returnLabel}
        </ButtonLink>

        {isOwner && booking.status === 'Confirmed' && (
          <Button
            variant="danger"
            size="sm"
            loading={cancelling}
            onClick={handleCancel}
          >
            Cancel reservation
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {/* Receipt header */}
        <div className="p-6 sm:p-8 bg-surface-raised border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-ink-muted block font-medium">
              E-ticket and booking confirmation
            </span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-ink">
                {booking.bookingReference}
              </span>
              <StatusBadge status={booking.status} />
            </div>
          </div>

          <div className="text-xs text-ink-muted">
            Booked on {formatDate(booking.bookingDate)}
          </div>
        </div>

        {/* Flight details */}
        <div className="p-6 sm:p-8 border-b border-line">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-6">
            Flight details
          </h2>

          {flight.flightNumber ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
              <div className="text-left md:text-center">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Departure</span>
                <div className="text-2xl font-bold font-mono text-ink mt-1">
                  {flight.origin?.code}
                </div>
                <div className="text-sm text-ink-muted">{flight.origin?.city}</div>
                <div className="text-sm font-semibold text-accent mt-1">
                  {flight.departureTime
                    ? `${formatDate(flight.departureTime)} at ${formatTime(flight.departureTime)}`
                    : ''}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-ink bg-canvas px-2.5 py-0.5 rounded border border-line">
                    {flight.flightNumber}
                  </span>
                  <Badge variant="neutral">{booking.seatClass}</Badge>
                </div>
                <div className="w-full flex items-center justify-center my-2 max-w-[140px]">
                  <div className="h-px bg-line-strong w-full relative">
                    <ArrowRight className="w-4 h-4 text-ink-muted absolute -top-2 left-1/2 -translate-x-1/2 bg-surface px-0.5" />
                  </div>
                </div>
                <span className="text-xs font-mono text-ink-muted">
                  {flight.departureTime && flight.arrivalTime
                    ? formatDuration(flight.departureTime, flight.arrivalTime)
                    : 'Non-stop'}
                </span>
              </div>

              <div className="text-left md:text-center">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Arrival</span>
                <div className="text-2xl font-bold font-mono text-ink mt-1">
                  {flight.destination?.code}
                </div>
                <div className="text-sm text-ink-muted">{flight.destination?.city}</div>
                <div className="text-sm font-semibold text-accent mt-1">
                  {flight.arrivalTime
                    ? `${formatDate(flight.arrivalTime)} at ${formatTime(flight.arrivalTime)}`
                    : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted italic">Flight details unavailable.</div>
          )}
        </div>

        {/* Passenger manifest list */}
        <div className="p-6 sm:p-8 border-b border-line">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-4">
            Passenger manifest ({booking.passengers?.length || 0})
          </h2>

          <ul className="divide-y divide-line text-sm">
            {booking.passengers?.map((passenger, index) => (
              <li
                key={index}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-ink-muted w-6">#{index + 1}</span>
                  <span className="font-medium text-ink">
                    {passenger.firstName} {passenger.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-ink-muted pl-9 sm:pl-0">
                  <span>
                    Born: <strong className="font-normal text-ink">{passenger.dateOfBirth ? formatDate(passenger.dateOfBirth) : 'N/A'}</strong>
                  </span>
                  {passenger.gender && (
                    <span>
                      Gender: <strong className="font-normal text-ink">{passenger.gender}</strong>
                    </span>
                  )}
                  <span>
                    Class: <strong className="font-normal text-ink">{booking.seatClass}</strong>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment and Billing Summary */}
        <div className="p-6 sm:p-8 bg-surface-raised flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-ink-muted block uppercase tracking-wider font-medium">
              Payment summary
            </span>
            <span className="text-xs text-ink-muted mt-0.5 block">
              {plural(booking.passengers?.length || 1, 'passenger', 'passengers')} × {booking.seatClass} class fare
            </span>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-ink-muted block uppercase tracking-wider font-medium">
              Total amount paid
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-accent mt-0.5 block">
              {formatPrice(booking.totalPrice)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingDetails;
