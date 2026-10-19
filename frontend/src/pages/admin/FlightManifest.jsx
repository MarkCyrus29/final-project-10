import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const FlightManifest = () => {
  const { id } = useParams();

  const [flight, setFlight] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

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

  // Aggregate all passengers from all bookings
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-3 text-sm text-gray-500">Loading flight passenger manifest...</p>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <h2 className="text-lg font-bold text-red-800">Flight Manifest Error</h2>
          <p className="mt-1 text-sm text-red-700">{error || 'Flight could not be found.'}</p>
          <Link
            to="/admin/flights"
            className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            ← Back to Flight Management
          </Link>
        </div>
      </div>
    );
  }

  const dep = new Date(flight.departureTime);
  const arr = new Date(flight.arrivalTime);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:p-0">
      {/* Top Navigation & Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <Link to="/admin/flights" className="text-sm text-blue-600 hover:underline">
            ← Back to Flight Management
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Flight Passenger Manifest</h1>
          <p className="text-sm text-gray-500">
            Official manifest of registered passengers for this flight schedule.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => window.print()}
            className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition flex items-center space-x-2"
          >
            <span>🖨 Print Manifest</span>
          </button>
        </div>
      </div>

      {/* Flight Information Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-2xl font-black bg-white/20 px-3 py-1 rounded">
                {flight.flightNumber}
              </span>
              <span className="text-xl font-bold">
                {flight.origin?.city} ({flight.origin?.code}) → {flight.destination?.city} ({flight.destination?.code})
              </span>
            </div>
            <p className="text-sm text-blue-100 mt-1">
              Departure: {dep.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
              {dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              Arrival: {arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                flight.status === 'Scheduled'
                  ? 'bg-emerald-500 text-white'
                  : flight.status === 'Delayed'
                  ? 'bg-amber-400 text-gray-900'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {flight.status}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200 text-center p-4 bg-gray-50/60">
          <div className="p-3">
            <span className="text-xs text-gray-500 block uppercase font-semibold">Total Capacity</span>
            <span className="text-2xl font-black text-gray-900">{flight.totalSeats} seats</span>
          </div>
          <div className="p-3">
            <span className="text-xs text-gray-500 block uppercase font-semibold">Available Seats</span>
            <span className="text-2xl font-black text-emerald-600">{flight.availableSeats}</span>
          </div>
          <div className="p-3">
            <span className="text-xs text-gray-500 block uppercase font-semibold">Confirmed Passengers</span>
            <span className="text-2xl font-black text-blue-600">{confirmedPassengersCount}</span>
          </div>
          <div className="p-3">
            <span className="text-xs text-gray-500 block uppercase font-semibold">Total Reservations</span>
            <span className="text-2xl font-black text-gray-800">{bookings.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h2 className="text-lg font-bold text-gray-900">
          Passenger List ({manifestPassengers.length})
        </h2>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Filter:</span>
          <div className="flex space-x-1">
            {['ALL', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  filterStatus === status
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

      {/* Passenger Manifest Table */}
      {manifestPassengers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center shadow-sm">
          <p className="text-gray-500">No passengers found for this flight.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Passenger Name</th>
                  <th className="px-5 py-3.5">Date of Birth</th>
                  <th className="px-5 py-3.5">Cabin Class</th>
                  <th className="px-5 py-3.5">Booking Reference</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Booked By / Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {manifestPassengers.map((item, index) => {
                  const dob = item.dateOfBirth ? new Date(item.dateOfBirth) : null;

                  return (
                    <tr key={`${item.bookingId}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900">
                        {item.firstName} {item.lastName}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                        {dob
                          ? dob.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'N/A'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                          {item.seatClass}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          to={`/bookings/${item.bookingId}`}
                          className="font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200"
                        >
                          {item.bookingReference}
                        </Link>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                            item.bookingStatus
                          )}`}
                        >
                          {item.bookingStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                        <div className="font-medium text-gray-900">{item.contactName}</div>
                        <div className="text-gray-500">{item.contactEmail}</div>
                        {item.contactPhone && item.contactPhone !== '—' && (
                          <div className="text-gray-400">{item.contactPhone}</div>
                        )}
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

export default FlightManifest;
