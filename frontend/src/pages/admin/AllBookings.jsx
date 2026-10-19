import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

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
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/api/bookings/${bookingId}`, { status: newStatus });
      setSuccess(`Booking status successfully updated to ${newStatus}.`);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter bookings based on status and search query
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline">
            ← Admin Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1">All Reservations</h1>
          <p className="text-sm text-gray-500">
            Monitor and update the status of all passenger bookings across the airline.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg text-emerald-700 text-sm mb-6">
          {success}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search reference, passenger, flight..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status:</span>
          <div className="flex space-x-1">
            {['ALL', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading all reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No bookings found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {bookings.length === 0
              ? 'No reservations have been placed yet in the system.'
              : 'No reservations match your current search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Booked By</th>
                  <th className="px-5 py-3.5">Flight & Route</th>
                  <th className="px-5 py-3.5">Class</th>
                  <th className="px-5 py-3.5">Passengers</th>
                  <th className="px-5 py-3.5">Total Price</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => {
                  const flight = booking.flight || {};
                  const user = booking.user || {};
                  const dep = flight.departureTime ? new Date(flight.departureTime) : null;
                  const isUpdating = updatingId === booking._id;

                  return (
                    <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                      {/* Reference code */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          to={`/bookings/${booking._id}`}
                          className="font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-xs inline-block"
                        >
                          {booking.bookingReference}
                        </Link>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(booking.bookingDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* User Account who booked */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {user.firstName ? `${user.firstName} ${user.lastName}` : 'Guest / Deleted'}
                        </div>
                        <div className="text-xs text-gray-500">{user.email || '—'}</div>
                      </td>

                      {/* Flight & Route */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {flight.flightNumber ? (
                          <div>
                            <span className="font-semibold text-gray-900">{flight.flightNumber}</span>
                            <span className="text-gray-400 mx-1">·</span>
                            <span className="font-semibold text-blue-700">
                              {flight.origin?.code} → {flight.destination?.code}
                            </span>
                            <div className="text-xs text-gray-500">
                              {dep
                                ? dep.toLocaleDateString([], { month: 'short', day: 'numeric' })
                                : '—'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Flight details unavailable</span>
                        )}
                      </td>

                      {/* Seat Class */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {booking.seatClass}
                        </span>
                      </td>

                      {/* Passenger count and preview */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 text-xs">
                          {booking.passengers?.length || 0} person(s)
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {booking.passengers?.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900">
                        ₱{booking.totalPrice?.toLocaleString()}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <select
                            value={booking.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusBadge(
                              booking.status
                            )} disabled:opacity-50 cursor-pointer`}
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          {isUpdating && (
                            <div className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent"></div>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/bookings/${booking._id}`}
                          className="text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBookings;
