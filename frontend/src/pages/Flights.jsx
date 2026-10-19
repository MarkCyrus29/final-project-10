import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import FlightCard from '../components/FlightCard';

const Flights = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search filter states
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const fetchFlights = async (searchParams = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchParams.origin) params.origin = searchParams.origin;
      if (searchParams.destination) params.destination = searchParams.destination;
      if (searchParams.date) params.date = searchParams.date;

      const response = await api.get('/api/flights', { params });
      setFlights(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFlights({ origin, destination, date });
  };

  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setDate('');
    fetchFlights({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero / Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Search & Book Flights</h1>
        <p className="mt-2 text-sm text-gray-600">
          Find your next destination with reliable and comfortable flights across the globe.
        </p>
      </div>

      {/* Flight Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="origin" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Origin (City or Code)
            </label>
            <input
              id="origin"
              type="text"
              placeholder="e.g. Manila or MNL"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="destination" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Destination (City or Code)
            </label>
            <input
              id="destination"
              type="text"
              placeholder="e.g. Cebu or CEB"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Travel Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition shadow-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg text-sm transition"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Searching available flights...</p>
        </div>
      ) : flights.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="text-4xl mb-3">🛫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No flights found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We couldn't find any flights matching your criteria. Try adjusting your origin, destination, or travel date.
          </p>
          <button
            onClick={handleReset}
            className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Clear filters & view all flights
          </button>
        </div>
      ) : (
        /* Flight Cards Grid */
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Showing {flights.length} flight{flights.length === 1 ? '' : 's'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flights.map((flight) => (
              <FlightCard key={flight._id} flight={flight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Flights;
