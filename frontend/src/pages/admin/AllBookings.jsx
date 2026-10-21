import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatDate, formatShortDate, plural } from '../../lib/format';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { DataTable } from '../../components/ui/DataTable';
import { TableSkeleton } from '../../components/ui/Skeleton';

const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const toast = useToast();

  useDocumentTitle('All reservations');

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/bookings');
      setBookings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await api.put(`/api/bookings/${bookingId}`, { status: newStatus });
      toast.success(`Booking status updated to ${newStatus}.`);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const ref = b.bookingReference?.toLowerCase() || '';
    const bookerName = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.toLowerCase();
    const flightNo = b.flight?.flightNumber?.toLowerCase() || '';
    const route = `${b.flight?.origin?.code || ''} ${b.flight?.destination?.code || ''}`.toLowerCase();
    const passengerNames = (b.passengers || [])
      .map((p) => `${p.firstName} ${p.lastName}`.toLowerCase())
      .join(' ');

    const matchesSearch =
      ref.includes(q) ||
      bookerName.includes(q) ||
      flightNo.includes(q) ||
      route.includes(q) ||
      passengerNames.includes(q);

    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      header: 'Reference',
      accessorKey: 'bookingReference',
      cell: (b) => (
        <div>
          <Link
            to={`/bookings/${b._id}`}
            className="font-mono text-xs font-semibold text-accent hover:underline"
          >
            {b.bookingReference}
          </Link>
          <div className="text-xs text-ink-muted">
            {formatShortDate(b.bookingDate)}
          </div>
        </div>
      )
    },
    {
      header: 'Booked by',
      cell: (b) => (
        <div>
          <div className="font-medium text-ink">
            {b.user?.firstName ? `${b.user.firstName} ${b.user.lastName}` : 'Guest / Deleted'}
          </div>
          <div className="text-xs text-ink-muted">{b.user?.email || '—'}</div>
        </div>
      )
    },
    {
      header: 'Flight & Route',
      cell: (b) => {
        const flight = b.flight || {};
        return flight.flightNumber ? (
          <div>
            <span className="font-mono font-medium text-ink">{flight.flightNumber}</span>{' '}
            <span className="text-ink-muted">· {flight.origin?.code} → {flight.destination?.code}</span>
            <div className="text-xs text-ink-muted">
              {flight.departureTime ? formatShortDate(flight.departureTime) : '—'}
            </div>
          </div>
        ) : (
          <span className="text-xs text-ink-muted italic">Unavailable</span>
        );
      }
    },
    {
      header: 'Class',
      cell: (b) => <Badge variant="neutral">{b.seatClass}</Badge>
    },
    {
      header: 'Passengers',
      cell: (b) => (
        <div>
          <div className="text-xs font-medium text-ink">
            {b.passengers?.length || 0} {plural(b.passengers?.length || 0, 'passenger', 'passengers')}
          </div>
          <div className="text-xs text-ink-muted truncate max-w-[140px]">
            {b.passengers?.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}
          </div>
        </div>
      )
    },
    {
      header: 'Total price',
      cell: (b) => (
        <span className="font-mono font-medium text-ink">
          {formatPrice(b.totalPrice)}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (b) => (
        <Select
          size="sm"
          hideLabel
          label="Status"
          value={b.status}
          disabled={updatingId === b._id || b.status === 'Cancelled'}
          onChange={(e) => handleStatusChange(b._id, e.target.value)}
          className="w-28"
        >
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </Select>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (b) => (
        <ButtonLink
          to={`/bookings/${b._id}`}
          variant="ghost"
          size="sm"
        >
          Details
        </ButtonLink>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <ButtonLink to="/admin" variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Admin dashboard
        </ButtonLink>
        <PageHeader
          title="All reservations"
          description="Monitor and update the status of all passenger bookings across the airline."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchBookings}
              loading={loading}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          }
        />
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="w-full md:w-80">
          <Input
            hideLabel
            label="Search reservations"
            id="searchQuery"
            placeholder="Search reference, passenger, flight..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-ink-muted uppercase tracking-wider whitespace-nowrap">
            Status:
          </span>
          <SegmentedControl
            options={['ALL', 'Confirmed', 'Completed', 'Cancelled']}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Card className="p-6">
          <TableSkeleton rows={6} cols={8} />
        </Card>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No bookings found"
          description={
            bookings.length === 0
              ? 'No reservations have been placed yet in the system.'
              : 'No reservations match your current search and filter criteria.'
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredBookings}
            keyField="_id"
            mobileCard={(b) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/bookings/${b._id}`}
                    className="font-mono text-xs font-semibold text-accent hover:underline"
                  >
                    {b.bookingReference}
                  </Link>
                  <Select
                    size="sm"
                    hideLabel
                    label="Status"
                    value={b.status}
                    disabled={updatingId === b._id || b.status === 'Cancelled'}
                    onChange={(e) => handleStatusChange(b._id, e.target.value)}
                    className="w-28 text-xs"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </Select>
                </div>
                <div className="text-sm font-medium text-ink">
                  {b.user?.firstName ? `${b.user.firstName} ${b.user.lastName}` : 'Guest'}
                  <span className="text-xs text-ink-muted block font-normal">{b.user?.email}</span>
                </div>
                <div className="text-xs text-ink-muted">
                  <span className="font-mono text-ink">{b.flight?.flightNumber || '—'}</span>{' '}
                  ({b.flight?.origin?.code} → {b.flight?.destination?.code}) · {b.seatClass}
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-line">
                  <span className="font-mono font-medium text-ink">
                    {formatPrice(b.totalPrice)}
                  </span>
                  <ButtonLink
                    to={`/bookings/${b._id}`}
                    variant="secondary"
                    size="sm"
                  >
                    Details
                  </ButtonLink>
                </div>
              </div>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default AllBookings;
