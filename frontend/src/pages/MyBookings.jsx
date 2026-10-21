import React, { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
import api from '../api/axios';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { formatPrice, formatDate, formatShortDate, formatTime, plural } from '../lib/format';
import { Button, ButtonLink } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { ListItemSkeleton } from '../components/ui/Skeleton';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const toast = useToast();
  const confirm = useConfirm();

  useDocumentTitle('My bookings');

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/bookings');
      setBookings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id, reference) => {
    const ok = await confirm({
      title: 'Cancel reservation',
      description: `Are you sure you want to cancel reservation ${reference}? Your seats will be released.`,
      confirmText: 'Cancel reservation',
      variant: 'danger'
    });

    if (!ok) return;

    setCancellingId(id);
    try {
      await api.delete(`/api/bookings/${id}`);
      toast.success(`Booking ${reference} has been cancelled.`);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: 'Cancelled' } : b))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="My bookings"
        description="View your upcoming flights and manage reservations."
        action={
          <ButtonLink to="/flights" variant="primary">
            Book a flight
          </ButtonLink>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <ListItemSkeleton count={3} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No bookings yet"
          description="You have no flight reservations registered to your account."
          action={
            <ButtonLink to="/flights" variant="primary">
              Search flights
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const flight = booking.flight || {};

            return (
              <Card
                key={booking._id}
                className="p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20">
                      {booking.bookingReference}
                    </span>
                    <StatusBadge status={booking.status} />
                    <span className="text-xs text-ink-muted">
                      Booked {formatShortDate(booking.bookingDate)}
                    </span>
                  </div>

                  {flight.flightNumber ? (
                    <div>
                      <div className="text-base font-semibold text-ink">
                        {flight.origin?.city} ({flight.origin?.code}) → {flight.destination?.city} ({flight.destination?.code})
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        Flight <span className="font-mono font-medium text-ink">{flight.flightNumber}</span> ·{' '}
                        {flight.departureTime
                          ? `${formatDate(flight.departureTime)} at ${formatTime(flight.departureTime)}`
                          : 'Date to be announced'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-ink-muted italic">Flight details unavailable</div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-ink-muted pt-0.5">
                    <span>
                      Cabin: <strong className="font-medium text-ink">{booking.seatClass}</strong>
                    </span>
                    <span>
                      Passengers: <strong className="font-medium text-ink">{booking.passengers?.length || 0}</strong>
                    </span>
                    <span>
                      Total paid: <strong className="font-mono font-medium text-accent">{formatPrice(booking.totalPrice)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-line">
                  <ButtonLink
                    to={`/bookings/${booking._id}`}
                    variant="secondary"
                    size="sm"
                  >
                    View details
                  </ButtonLink>

                  {booking.status === 'Confirmed' && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={cancellingId === booking._id}
                      onClick={() => handleCancel(booking._id, booking.bookingReference)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
