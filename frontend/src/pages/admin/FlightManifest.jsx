import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Users, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate, formatShortDate, formatTime } from '../../lib/format';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { DataTable } from '../../components/ui/DataTable';
import { TableSkeleton } from '../../components/ui/Skeleton';

const FlightManifest = () => {
  const { id } = useParams();

  const [flight, setFlight] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useDocumentTitle(flight ? `Manifest · ${flight.flightNumber}` : 'Flight manifest');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [flightRes, bookingsRes] = await Promise.all([
          api.get(`/api/flights/${id}`),
          api.get(`/api/bookings?flight=${id}`)
        ]);

        setFlight(flightRes.data);
        setBookings(bookingsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load flight passenger manifest.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const manifestPassengers = [];
  bookings.forEach((booking) => {
    if (filterStatus !== 'ALL' && booking.status !== filterStatus) {
      return;
    }

    (booking.passengers || []).forEach((passenger) => {
      manifestPassengers.push({
        passengerId: passenger._id,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        dateOfBirth: passenger.dateOfBirth,
        gender: passenger.gender,
        seatClass: booking.seatClass,
        bookingReference: booking.bookingReference,
        bookingId: booking._id,
        bookingStatus: booking.status,
        contactName: booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'N/A',
        contactEmail: booking.user?.email || 'N/A',
        contactPhone: booking.user?.phone || '—'
      });
    });
  });

  const confirmedPassengersCount = bookings
    .filter((b) => b.status === 'Confirmed')
    .reduce((sum, b) => sum + (b.passengers?.length || 0), 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card className="p-6">
          <TableSkeleton rows={6} cols={8} />
        </Card>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          icon={AlertCircle}
          title="Flight manifest error"
          description={error || 'Flight could not be found.'}
          action={
            <ButtonLink to="/admin/flights" variant="secondary">
              Back to flight management
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const columns = [
    {
      header: '#',
      cell: (_, index) => (
        <span className="font-mono text-xs text-ink-muted">{index + 1}</span>
      )
    },
    {
      header: 'Passenger name',
      cell: (item) => (
        <span className="font-semibold text-ink">
          {item.firstName} {item.lastName}
        </span>
      )
    },
    {
      header: 'Date of birth',
      cell: (item) => (
        <span className="text-ink-muted">
          {item.dateOfBirth ? formatShortDate(item.dateOfBirth) : 'N/A'}
        </span>
      )
    },
    {
      header: 'Gender',
      cell: (item) => <span className="text-ink-muted">{item.gender || '—'}</span>
    },
    {
      header: 'Cabin class',
      cell: (item) => <Badge variant="neutral">{item.seatClass}</Badge>
    },
    {
      header: 'Booking reference',
      cell: (item) => (
        <Link
          to={`/bookings/${item.bookingId}`}
          className="font-mono text-xs font-semibold text-accent hover:underline"
        >
          {item.bookingReference}
        </Link>
      )
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.bookingStatus} />
    },
    {
      header: 'Booked by / Contact',
      cell: (item) => (
        <div className="text-xs">
          <div className="font-medium text-ink">{item.contactName}</div>
          <div className="text-ink-muted">{item.contactEmail}</div>
          {item.contactPhone && item.contactPhone !== '—' && (
            <div className="text-ink-muted">{item.contactPhone}</div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:p-0 print:space-y-4">
      {/* Top Navigation & Controls */}
      <div className="print:hidden">
        <ButtonLink to="/admin/flights" variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to flight management
        </ButtonLink>
        <PageHeader
          title="Flight passenger manifest"
          description="Official manifest of registered passengers for this flight schedule."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print manifest
            </Button>
          }
        />
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Flight Information Banner */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-surface-raised border-b border-line flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-tight text-ink">
                {flight.flightNumber}
              </span>
              <span className="text-lg font-semibold text-ink">
                {flight.origin?.city} ({flight.origin?.code}) → {flight.destination?.city} ({flight.destination?.code})
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Departure: {formatDate(flight.departureTime)} at {formatTime(flight.departureTime)}
              {' · '}
              Arrival: {formatTime(flight.arrivalTime)}
            </p>
          </div>

          <div>
            <StatusBadge status={flight.status} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line text-center bg-canvas">
          <div className="p-4">
            <span className="text-xs text-ink-muted block uppercase tracking-wider font-medium">Total capacity</span>
            <span className="text-2xl font-bold font-mono text-ink mt-0.5 block">{flight.totalSeats} seats</span>
          </div>
          <div className="p-4">
            <span className="text-xs text-ink-muted block uppercase tracking-wider font-medium">Available seats</span>
            <span className="text-2xl font-bold font-mono text-accent mt-0.5 block">{flight.availableSeats}</span>
          </div>
          <div className="p-4">
            <span className="text-xs text-ink-muted block uppercase tracking-wider font-medium">Confirmed passengers</span>
            <span className="text-2xl font-bold font-mono text-ink mt-0.5 block">{confirmedPassengersCount}</span>
          </div>
          <div className="p-4">
            <span className="text-xs text-ink-muted block uppercase tracking-wider font-medium">Total reservations</span>
            <span className="text-2xl font-bold font-mono text-ink mt-0.5 block">{bookings.length}</span>
          </div>
        </div>
      </Card>

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <h2 className="text-base font-semibold text-ink">
          Passenger list ({manifestPassengers.length})
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Filter:
          </span>
          <SegmentedControl
            options={['ALL', 'Confirmed', 'Completed', 'Cancelled']}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>
      </div>

      {/* Passenger Manifest Table */}
      {manifestPassengers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No passengers found"
          description="No passengers registered for this flight matching the selected filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            data={manifestPassengers}
            keyField="passengerId"
            mobileCard={(item, index) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-ink-muted">#{index + 1}</span>
                    <span className="font-medium text-ink">
                      {item.firstName} {item.lastName}
                    </span>
                  </div>
                  <StatusBadge status={item.bookingStatus} />
                </div>
                <div className="text-xs text-ink-muted flex items-center gap-3">
                  <span>DOB: {item.dateOfBirth ? formatShortDate(item.dateOfBirth) : 'N/A'}</span>
                  {item.gender && <span>{item.gender}</span>}
                  <Badge variant="neutral">{item.seatClass}</Badge>
                </div>
                <div className="text-xs pt-1 border-t border-line flex justify-between items-center">
                  <span className="text-ink-muted">Ref:</span>
                  <Link
                    to={`/bookings/${item.bookingId}`}
                    className="font-mono font-semibold text-accent hover:underline"
                  >
                    {item.bookingReference}
                  </Link>
                </div>
                <div className="text-xs text-ink-muted pt-1 border-t border-line">
                  Contact: <span className="text-ink font-medium">{item.contactName}</span> ({item.contactEmail})
                </div>
              </div>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default FlightManifest;
