import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

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
    if (!window.confirm(`Are you sure you want to cancel reservation ${reference}? Your seats will be released.`)) {
      return;
    }

    setCancellingId(id);
    setError('');
    setSuccess('');
    try {
      const response = await api.delete(`/api/bookings/${id}`);
      setSuccess(`Booking ${reference} has been cancelled successfully.`);
      // Update state in place: change status to Cancelled so Cancel button disappears
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: 'Cancelled' } : b))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setCancellingId(null);
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Bookings</h1>
          <p className="mt-1 text-sm text-gray-600">
            View your upcoming flights, booking references, and manage reservations.
          </p>
        </div>
        <Link
          to="/flights"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition shadow-sm"
        >
          + Book New Flight
        </Link>
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

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading your reservations...</p>
        </div>
      ) : bookings.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
          <div className="text-4xl mb-3">🎫</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No bookings yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            You don't have any flight reservations registered to your account right now.
          </p>
          <Link
            to="/flights"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition shadow-sm"
          >
            Search Flights Now
          </Link>
        </div>
      ) : (
        /* Bookings List */
        <div className="space-y-5">
          {bookings.map((booking) => {
            const flight = booking.flight || {};
            const dep = flight.departureTime ? new Date(flight.departureTime) : null;

            return (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                {/* Left: Reference, Route, Flight number */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-md border border-blue-200">
                      {booking.bookingReference}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Booked on {new Date(booking.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {flight.flightNumber ? (
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {flight.origin?.city} ({flight.origin?.code}) → {flight.destination?.city} ({flight.destination?.code})
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Flight <strong className="font-semibold text-gray-700">{flight.flightNumber}</strong> ·{' '}
                        {dep
                          ? `${dep.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at ${dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Date to be announced'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">Flight details unavailable</div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-1">
                    <span>
                      Cabin: <strong className="text-gray-900 font-semibold">{booking.seatClass}</strong>
                    </span>
                    <span>
                      Passengers: <strong className="text-gray-900 font-semibold">{booking.passengers?.length || 0}</strong>
                    </span>
                    <span>
                      Total Paid: <strong className="text-blue-600 font-bold">₱{booking.totalPrice?.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                  <Link
                    to={`/bookings/${booking._id}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    View Details
                  </Link>

                  {/* Cancel button: only visible if Confirmed */}
                  {booking.status === 'Confirmed' && (
                    <button
                      onClick={() => handleCancel(booking._id, booking.bookingReference)}
                      disabled={cancellingId === booking._id}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
