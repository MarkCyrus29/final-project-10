import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const ManageFlights = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchFlights = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/flights?all=true');
      setFlights(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch flights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const handleDelete = async (id, flightNumber) => {
    if (!window.confirm(`Are you sure you want to delete flight ${flightNumber}?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/flights/${id}`);
      setSuccess(`Flight ${flightNumber} deleted successfully.`);
      setFlights((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete flight.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link to="/admin" className="text-sm text-blue-600 hover:underline">
              ← Admin Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Flight Management</h1>
          <p className="text-sm text-gray-500">Manage all airline flights, schedules, and capacities.</p>
        </div>

        <Link
          to="/admin/flights/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm shadow-sm transition"
        >
          + Add New Flight
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

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading flight schedules...</p>
        </div>
      ) : flights.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No flights registered yet.</p>
          <Link
            to="/admin/flights/new"
            className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline"
          >
            Create the first flight
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Flight #</th>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Departure</th>
                  <th className="px-6 py-3.5">Arrival</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Seats</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flights.map((flight) => {
                  const dep = new Date(flight.departureTime);
                  const arr = new Date(flight.arrivalTime);

                  return (
                    <tr key={flight._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-gray-900 whitespace-nowrap">
                        {flight.flightNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold">{flight.origin.code}</span>
                        <span className="text-gray-400 mx-1.5">→</span>
                        <span className="font-semibold">{flight.destination.code}</span>
                        <div className="text-xs text-gray-500">
                          {flight.origin.city} to {flight.destination.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{dep.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-xs text-gray-500">
                          {dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{arr.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-xs text-gray-500">
                          {arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        ₱{flight.basePrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            flight.availableSeats > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {flight.availableSeats}
                        </span>
                        <span className="text-gray-400 text-xs"> / {flight.totalSeats}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            flight.status === 'Scheduled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : flight.status === 'Delayed'
                              ? 'bg-amber-100 text-amber-800'
                              : flight.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {flight.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Link
                          to={`/admin/flights/${flight._id}/edit`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(flight._id, flight.flightNumber)}
                          className="text-rose-600 hover:text-rose-800 font-medium text-xs bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded transition"
                        >
                          Delete
                        </button>
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

export default ManageFlights;
