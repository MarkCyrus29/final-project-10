import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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

      // Calculate total revenue from non-cancelled bookings
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

      // Keep recent 5 bookings for quick glance
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase">
              Staff Portal
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Welcome back, <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email}). Here is your real-time operational overview.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm"
        >
          {loading ? 'Refreshing...' : '↻ Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Metrics Cards Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading analytics counters...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Flights */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-300 transition group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Flights</span>
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                ✈
              </span>
            </div>
            <div className="text-3xl font-black text-gray-900 mt-3">{stats.flightsCount}</div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">Schedules active</span>
              <Link to="/admin/flights" className="text-blue-600 hover:underline font-semibold">
                Manage Flights →
              </Link>
            </div>
          </div>

          {/* Card 2: Total Bookings */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-emerald-300 transition group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bookings</span>
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                🎫
              </span>
            </div>
            <div className="text-3xl font-black text-gray-900 mt-3">{stats.bookingsCount}</div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-emerald-600 font-semibold">{stats.confirmedBookings} confirmed</span>
              <Link to="/admin/bookings" className="text-blue-600 hover:underline font-semibold">
                All Bookings →
              </Link>
            </div>
          </div>

          {/* Card 3: Total Users */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-purple-300 transition group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</span>
              <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">
                👥
              </span>
            </div>
            <div className="text-3xl font-black text-gray-900 mt-3">{stats.usersCount}</div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500">Registered accounts</span>
              <Link to="/admin/users" className="text-blue-600 hover:underline font-semibold">
                Manage Users →
              </Link>
            </div>
          </div>

          {/* Card 4: Total Revenue */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-amber-300 transition group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Revenue</span>
              <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
                ₱
              </span>
            </div>
            <div className="text-3xl font-black text-gray-900 mt-3">
              ₱{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              From confirmed/completed bookings
            </div>
          </div>
        </div>
      )}

      {/* Navigation Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/flights"
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition block group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl text-xl">🛫</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                Flight Management
              </h3>
              <p className="text-xs text-gray-500">Add, edit, cancel flight schedules & view manifests.</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center text-sm font-semibold text-blue-600">
            <span>Open flight controls</span>
            <span>→</span>
          </div>
        </Link>

        <Link
          to="/admin/bookings"
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition block group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xl">📑</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                All Bookings
              </h3>
              <p className="text-xs text-gray-500">View system-wide bookings and update statuses.</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center text-sm font-semibold text-blue-600">
            <span>Review all reservations</span>
            <span>→</span>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition block group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl text-xl">👤</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                User Management
              </h3>
              <p className="text-xs text-gray-500">View registered passengers and remove accounts.</p>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center text-sm font-semibold text-blue-600">
            <span>Manage accounts</span>
            <span>→</span>
          </div>
        </Link>
      </div>

      {/* Recent Bookings Snapshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Reservations</h2>
            <p className="text-xs text-gray-500">Latest passenger bookings placed across the system.</p>
          </div>
          <Link
            to="/admin/bookings"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition"
          >
            View All Bookings ({stats.bookingsCount}) →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No reservations available to display.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Booked By</th>
                  <th className="px-6 py-3">Flight</th>
                  <th className="px-6 py-3">Passengers</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-blue-600">
                      <Link to={`/bookings/${b._id}`} className="hover:underline">
                        {b.bookingReference}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-gray-900 font-medium">
                      {b.user ? `${b.user.firstName} ${b.user.lastName}` : 'Guest'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {b.flight?.flightNumber || '—'} ({b.flight?.origin?.code} → {b.flight?.destination?.code})
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{b.passengers?.length || 0}</td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">₱{b.totalPrice?.toLocaleString()}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
