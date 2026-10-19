import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const FlightDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFlight = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/flights/${id}`);
        setFlight(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch flight details');
      } finally {
        setLoading(false);
      }
    };

    fetchFlight();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-3 text-sm text-gray-500">Loading flight details...</p>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <h2 className="text-lg font-bold text-red-800">Flight Not Found</h2>
          <p className="mt-1 text-sm text-red-700">{error || 'Unable to locate flight with this ID.'}</p>
          <Link
            to="/flights"
            className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            ← Back to Flights
          </Link>
        </div>
      </div>
    );
  }

  const depDate = new Date(flight.departureTime);
  const arrDate = new Date(flight.arrivalTime);

  const formattedDepTime = depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedArrTime = arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = depDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const durationMs = Math.max(0, arrDate - depDate);
  const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  const isBookable = flight.status === 'Scheduled' && flight.availableSeats > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/flights"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Flight Search
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-lg font-bold bg-white/20 px-3 py-1 rounded backdrop-blur-sm">
                {flight.flightNumber}
              </span>
              <span className="text-sm font-medium bg-white/10 px-2.5 py-1 rounded">
                {flight.seatClass || 'Economy'}
              </span>
            </div>
            <p className="mt-2 text-sm text-blue-100">Scheduled on {formattedDate}</p>
          </div>

          <div>
            <span
              className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold shadow-sm ${
                flight.status === 'Scheduled'
                  ? 'bg-emerald-500 text-white'
                  : flight.status === 'Delayed'
                  ? 'bg-amber-400 text-gray-900'
                  : flight.status === 'Cancelled'
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}
            >
              {flight.status}
            </span>
          </div>
        </div>

        {/* Flight Route and Timings */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center pb-8 border-b border-gray-100">
            <div className="text-left md:text-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Departure</span>
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{flight.origin.code}</div>
              <div className="text-base font-medium text-gray-700">{flight.origin.city}</div>
              <div className="text-sm text-blue-600 font-semibold mt-1">{formattedDepTime}</div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400 font-medium">Duration: {durationHrs}h {durationMins}m</span>
              <div className="w-full flex items-center justify-center my-2">
                <div className="h-0.5 bg-gray-200 w-full relative">
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm">✈</span>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                Non-stop flight
              </span>
            </div>

            <div className="text-right md:text-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Arrival</span>
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{flight.destination.code}</div>
              <div className="text-base font-medium text-gray-700">{flight.destination.city}</div>
              <div className="text-sm text-blue-600 font-semibold mt-1">{formattedArrTime}</div>
            </div>
          </div>

          {/* Details breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-100 text-sm">
            <div>
              <span className="text-xs text-gray-500 block">Base Fare</span>
              <span className="text-lg font-bold text-gray-900">₱{flight.basePrice.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Available Seats</span>
              <span className={`text-lg font-bold ${flight.availableSeats > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {flight.availableSeats} / {flight.totalSeats}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Cabin Class</span>
              <span className="text-lg font-bold text-gray-900">{flight.seatClass || 'Economy'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Aircraft Status</span>
              <span className="text-lg font-bold text-gray-900">{flight.status}</span>
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-gray-500 block">Total Base Price per Passenger</span>
              <span className="text-2xl font-black text-blue-600">₱{flight.basePrice.toLocaleString()}</span>
            </div>

            {/* If logged out -> redirect to /login */}
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl transition shadow-md"
              >
                Sign In to Book This Flight
              </button>
            )}

            {/* If passenger -> show Book button */}
            {user && user.role === 'passenger' && (
              isBookable ? (
                <Link
                  to={`/book/${flight._id}`}
                  className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition shadow-md"
                >
                  Book This Flight →
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto bg-gray-200 text-gray-500 font-semibold px-8 py-3 rounded-xl cursor-not-allowed"
                >
                  {flight.status !== 'Scheduled' ? `Flight is ${flight.status}` : 'No Seats Available'}
                </button>
              )
            )}

            {/* If admin -> do not show Book button */}
            {user && user.role === 'admin' && (
              <div className="text-sm bg-purple-50 text-purple-800 border border-purple-200 px-4 py-2 rounded-lg font-medium">
                Admin mode: Booking is restricted to passenger accounts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetails;
