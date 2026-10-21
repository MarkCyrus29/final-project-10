import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Ticket, Users, DollarSign, RefreshCw, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatPrice } from '../../lib/format';
import { Button, ButtonLink } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Alert } from '../../components/ui/Alert';
import { DataTable } from '../../components/ui/DataTable';
import { TableSkeleton } from '../../components/ui/Skeleton';

const AdminDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    flightsCount: 0,
    bookingsCount: 0,
    usersCount: 0,
    totalRevenue: 0,
    confirmedBookings: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle('Admin dashboard');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [flightsRes, bookingsRes, usersRes] = await Promise.all([
        api.get('/api/flights?all=true'),
        api.get('/api/bookings'),
        api.get('/api/users')
      ]);

      const flights = flightsRes.data || [];
      const bookings = bookingsRes.data || [];
      const users = usersRes.data || [];

      const revenue = bookings
        .filter((b) => b.status !== 'Cancelled')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;

      setStats({
        flightsCount: flights.length,
        bookingsCount: bookings.length,
        usersCount: users.length,
        totalRevenue: revenue,
        confirmedBookings: confirmed
      });

      setRecentBookings(bookings.slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const recentBookingColumns = [
    {
      header: 'Reference',
      accessorKey: 'bookingReference',
      cell: (b) => (
        <Link
          to={`/bookings/${b._id}`}
          className="font-mono text-xs font-semibold text-accent hover:underline"
        >
          {b.bookingReference}
        </Link>
      )
    },
    {
      header: 'Booked by',
      cell: (b) => (
        <span className="font-medium text-ink">
          {b.user ? `${b.user.firstName} ${b.user.lastName}` : 'Guest'}
        </span>
      )
    },
    {
      header: 'Flight',
      cell: (b) => (
        <span className="text-ink-muted">
          <span className="font-mono text-ink font-medium">{b.flight?.flightNumber || '—'}</span>{' '}
          ({b.flight?.origin?.code} → {b.flight?.destination?.code})
        </span>
      )
    },
    {
      header: 'Passengers',
      cell: (b) => (
        <span className="text-ink-muted">{b.passengers?.length || 0}</span>
      )
    },
    {
      header: 'Total',
      cell: (b) => (
        <span className="font-mono font-medium text-ink">
          {formatPrice(b.totalPrice)}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (b) => <StatusBadge status={b.status} />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Admin dashboard"
        description={`Welcome back, ${user?.firstName} ${user?.lastName} (${user?.email}). Here is your real-time operational overview.`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            loading={loading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh data
          </Button>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Total flights
            </span>
            <div className="w-8 h-8 rounded-md bg-canvas border border-line flex items-center justify-center text-ink-muted">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink">
            {stats.flightsCount}
          </div>
          <div className="pt-2 border-t border-line flex justify-between items-center text-xs">
            <span className="text-ink-muted">Schedules active</span>
            <Link to="/admin/flights" className="text-accent hover:underline font-medium">
              Manage flights →
            </Link>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Total bookings
            </span>
            <div className="w-8 h-8 rounded-md bg-canvas border border-line flex items-center justify-center text-ink-muted">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink">
            {stats.bookingsCount}
          </div>
          <div className="pt-2 border-t border-line flex justify-between items-center text-xs">
            <span className="text-ink-muted">{stats.confirmedBookings} confirmed</span>
            <Link to="/admin/bookings" className="text-accent hover:underline font-medium">
              All bookings →
            </Link>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Total users
            </span>
            <div className="w-8 h-8 rounded-md bg-canvas border border-line flex items-center justify-center text-ink-muted">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-ink">
            {stats.usersCount}
          </div>
          <div className="pt-2 border-t border-line flex justify-between items-center text-xs">
            <span className="text-ink-muted">Registered accounts</span>
            <Link to="/admin/users" className="text-accent hover:underline font-medium">
              Manage users →
            </Link>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              System revenue
            </span>
            <div className="w-8 h-8 rounded-md bg-canvas border border-line flex items-center justify-center text-ink-muted">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-accent">
            {formatPrice(stats.totalRevenue)}
          </div>
          <div className="pt-2 border-t border-line text-xs text-ink-muted">
            From confirmed bookings
          </div>
        </Card>
      </div>

      {/* Navigation Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to="/admin/flights"
          className="group"
        >
          <Card className="p-5 sm:p-6 transition hover:border-line-strong h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-md bg-canvas border border-line flex items-center justify-center text-accent mb-3">
                <Plane className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink group-hover:text-accent transition">
                Flight management
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                Add, edit, cancel flight schedules and view passenger manifests.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-medium text-accent">
              <span>Open flight controls</span>
              <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
            </div>
          </Card>
        </Link>

        <Link
          to="/admin/bookings"
          className="group"
        >
          <Card className="p-5 sm:p-6 transition hover:border-line-strong h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-md bg-canvas border border-line flex items-center justify-center text-accent mb-3">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink group-hover:text-accent transition">
                All bookings
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                View system-wide reservations and update booking statuses.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-medium text-accent">
              <span>Review all reservations</span>
              <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
            </div>
          </Card>
        </Link>

        <Link
          to="/admin/users"
          className="group"
        >
          <Card className="p-5 sm:p-6 transition hover:border-line-strong h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-md bg-canvas border border-line flex items-center justify-center text-accent mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink group-hover:text-accent transition">
                User management
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                View registered passengers and remove inactive accounts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-medium text-accent">
              <span>Manage accounts</span>
              <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Bookings Snapshot */}
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-line flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Recent reservations</h2>
            <p className="text-xs text-ink-muted">Latest passenger bookings placed across the system.</p>
          </div>
          <ButtonLink
            to="/admin/bookings"
            variant="ghost"
            size="sm"
          >
            View all ({stats.bookingsCount})
          </ButtonLink>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="p-8 text-center text-ink-muted text-sm">
            No reservations available to display.
          </div>
        ) : (
          <DataTable
            columns={recentBookingColumns}
            data={recentBookings}
            keyField="_id"
            mobileCard={(b) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/bookings/${b._id}`}
                    className="font-mono text-xs font-semibold text-accent hover:underline"
                  >
                    {b.bookingReference}
                  </Link>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-sm font-medium text-ink">
                  {b.user ? `${b.user.firstName} ${b.user.lastName}` : 'Guest'}
                </div>
                <div className="text-xs text-ink-muted">
                  <span className="font-mono text-ink">{b.flight?.flightNumber || '—'}</span>{' '}
                  ({b.flight?.origin?.code} → {b.flight?.destination?.code}) · {b.passengers?.length || 0} pax
                </div>
                <div className="text-sm font-mono font-medium text-ink pt-1 border-t border-line">
                  {formatPrice(b.totalPrice)}
                </div>
              </div>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
