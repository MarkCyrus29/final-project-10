import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [success, setSuccess] = useState('');

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
    if (!window.confirm(`Are you sure you want to cancel booking ${booking.bookingReference}?`)) {
      return;
    }

    setCancelling(true);
    setError('');
    try {
      const response = await api.delete(`/api/bookings/${id}`);
      setBooking((prev) => ({ ...prev, status: 'Cancelled' }));
      setSuccess('Booking has been cancelled and seats have been restored.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-3 text-sm text-gray-500">Loading reservation receipt...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <h2 className="text-lg font-bold text-red-800">Booking Access Error</h2>
          <p className="mt-1 text-sm text-red-700">{error || 'Booking could not be found.'}</p>
          <Link
            to={user?.role === 'admin' ? '/admin' : '/my-bookings'}
            className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            ← Return to {user?.role === 'admin' ? 'Admin Dashboard' : 'My Bookings'}
          </Link>
        </div>
      </div>
    );
  }

  const flight = booking.flight || {};
  const dep = flight.departureTime ? new Date(flight.departureTime) : null;
  const arr = flight.arrivalTime ? new Date(flight.arrivalTime) : null;

  const isOwner = user && booking.user && (booking.user._id === user._id || booking.user === user._id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex justify-between items-center">
        <Link
          to={user?.role === 'admin' ? '/admin' : '/my-bookings'}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Return to {user?.role === 'admin' ? 'Admin' : 'My Bookings'}
        </Link>
        {isOwner && booking.status === 'Confirmed' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
          </button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg text-emerald-700 text-sm mb-6">
          {success}
        </div>
      )}

      {/* Main Reservation Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Ticket banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-200 block font-semibold">
              E-Ticket & Booking Confirmation
            </span>
            <div className="flex items-center space-x-3 mt-1">
              <span className="font-mono text-2xl font-black">{booking.bookingReference}</span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                  booking.status === 'Confirmed'
                    ? 'bg-emerald-500 text-white'
                    : booking.status === 'Cancelled'
                    ? 'bg-rose-500 text-white'
                    : 'bg-blue-400 text-blue-950'
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          <div className="text-sm text-blue-100 text-left sm:text-right">
            <span>Booked on {new Date(booking.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Flight Information */}
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
            Flight Details
          </h2>
          {flight.flightNumber ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
              <div className="text-left md:text-center">
                <span className="text-xs font-medium text-gray-400 uppercase">Departure</span>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">{flight.origin?.code}</div>
                <div className="text-sm font-semibold text-gray-700">{flight.origin?.city}</div>
                <div className="text-xs text-blue-600 font-medium mt-1">
                  {dep ? `${dep.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                  {flight.flightNumber}
                </span>
                <div className="w-full flex items-center justify-center my-2">
                  <div className="h-0.5 bg-gray-200 w-full relative">
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm">✈</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{booking.seatClass} Class</span>
              </div>

              <div className="text-right md:text-center">
                <span className="text-xs font-medium text-gray-400 uppercase">Arrival</span>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">{flight.destination?.code}</div>
                <div className="text-sm font-semibold text-gray-700">{flight.destination?.city}</div>
                <div className="text-xs text-blue-600 font-medium mt-1">
                  {arr ? `${arr.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">Flight details unavailable.</div>
          )}
        </div>

        {/* Passenger Manifest */}
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
            Passenger Manifest ({booking.passengers?.length || 0})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Date of Birth</th>
                  <th className="px-4 py-3">Seat Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {booking.passengers?.map((passenger, index) => {
                  const dob = passenger.dateOfBirth ? new Date(passenger.dateOfBirth) : null;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {passenger.firstName} {passenger.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {dob ? dob.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{booking.seatClass}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment and Billing Summary */}
        <div className="p-8 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-gray-500 block">Payment Summary</span>
            <span className="text-xs text-gray-600">
              {booking.passengers?.length} passenger(s) × {booking.seatClass} class fare
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-400 block font-semibold uppercase">Total Amount Paid</span>
            <span className="text-3xl font-black text-blue-600">
              ₱{booking.totalPrice?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
