import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Class price multipliers
const MULTIPLIERS = {
  Economy: 1,
  Business: 2,
  'First Class': 3
};

// Passenger validation schema
const schema = yup.object().shape({
  seatClass: yup.string().oneOf(['Economy', 'Business', 'First Class']).required(),
  passengers: yup
    .array()
    .of(
      yup.object().shape({
        firstName: yup.string().trim().required('First name is required'),
        lastName: yup.string().trim().required('Last name is required'),
        dateOfBirth: yup
          .string()
          .required('Date of birth is required')
          .test('not-future', 'Date of birth cannot be in the future', (value) => {
            return !value || new Date(value) <= new Date();
          })
      })
    )
    .min(1, 'At least 1 passenger is required')
    .max(9, 'Maximum 9 passengers per booking')
});

const BookFlight = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      seatClass: 'Economy',
      passengers: [{ firstName: user?.firstName || '', lastName: user?.lastName || '', dateOfBirth: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'passengers'
  });

  const selectedClass = watch('seatClass') || 'Economy';
  const watchedPassengers = watch('passengers') || [];

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

  // Adjust passenger count
  const handlePassengerCountChange = (newCount) => {
    const target = Math.max(1, Math.min(9, Number(newCount)));
    const current = fields.length;

    if (target > current) {
      for (let i = current; i < target; i++) {
        append({ firstName: '', lastName: '', dateOfBirth: '' });
      }
    } else if (target < current) {
      for (let i = current - 1; i >= target; i--) {
        remove(i);
      }
    }
  };

  const onSubmit = async (data) => {
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        flightId: flight._id,
        seatClass: data.seatClass,
        passengers: data.passengers.map((p) => ({
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          dateOfBirth: new Date(p.dateOfBirth).toISOString()
        }))
      };

      const response = await api.post('/api/bookings', payload);
      setBookingResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-3 text-sm text-gray-500">Preparing flight booking...</p>
      </div>
    );
  }

  if (error && !flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <h2 className="text-lg font-bold text-red-800">Flight Unavailable</h2>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <Link
            to="/flights"
            className="mt-4 inline-block bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            ← Back to Flights
          </Link>
        </div>
      </div>
    );
  }

  // Confirmation view after booking
  if (bookingResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden text-center p-8 sm:p-12">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
            ✓
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Reservation Confirmed!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for booking with us. Your reservation is safely secured in our system.
          </p>

          {/* Reference badge */}
          <div className="my-8 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 max-w-md mx-auto">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-widest block mb-1">
              Booking Reference Code
            </span>
            <span className="font-mono text-3xl font-black text-blue-900 tracking-wider">
              {bookingResult.bookingReference}
            </span>
            <p className="text-xs text-blue-600 mt-2">
              Save this reference code to view or manage your reservation anytime.
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-gray-50 rounded-xl p-6 text-left max-w-lg mx-auto text-sm space-y-3 border border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-500">Flight:</span>
              <span className="font-semibold text-gray-900">
                {flight.flightNumber} ({flight.origin.code} → {flight.destination.code})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Class:</span>
              <span className="font-semibold text-gray-900">{bookingResult.seatClass}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Passengers:</span>
              <span className="font-semibold text-gray-900">{bookingResult.passengers?.length} passenger(s)</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <span className="text-gray-700 font-semibold">Total Price:</span>
              <span className="font-bold text-lg text-blue-600">
                ₱{bookingResult.totalPrice?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/my-bookings"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition shadow-sm"
            >
              View My Bookings
            </Link>
            <Link
              to="/flights"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl transition"
            >
              Book Another Flight
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate pricing
  const multiplier = MULTIPLIERS[selectedClass] || 1;
  const count = watchedPassengers.length || 1;
  const estimatedTotal = (flight?.basePrice || 0) * multiplier * count;

  const dep = new Date(flight.departureTime);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link to={`/flights/${flight._id}`} className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Back to Flight Details
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Book Your Flight</h1>
        <p className="text-sm text-gray-500">Enter passenger information and confirm your reservation.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Flight summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded">
              {flight.flightNumber}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {flight.origin.city} ({flight.origin.code}) → {flight.destination.city} ({flight.destination.code})
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Departure: {dep.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
            {dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-gray-400 block">Base Fare</span>
          <span className="text-xl font-extrabold text-gray-900">₱{flight.basePrice.toLocaleString()}</span>
          <span className="text-xs text-emerald-600 block mt-0.5">
            {flight.availableSeats} seat(s) available
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Class and Passenger Count selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">1. Booking Options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Cabin Class
              </label>
              <select
                {...register('seatClass')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Economy">Economy (1x base price)</option>
                <option value="Business">Business (2x base price)</option>
                <option value="First Class">First Class (3x base price)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Number of Passengers (1-9)
              </label>
              <select
                value={fields.length}
                onChange={(e) => handlePassengerCountChange(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <option key={num} value={num} disabled={num > flight.availableSeats}>
                    {num} Passenger{num > 1 ? 's' : ''} {num > flight.availableSeats ? '(Not enough seats)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Passenger Information Forms */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">2. Passenger Information</h2>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Passenger #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Juan"
                      {...register(`passengers.${index}.firstName`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                    {errors.passengers?.[index]?.firstName && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.passengers[index].firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dela Cruz"
                      {...register(`passengers.${index}.lastName`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                    {errors.passengers?.[index]?.lastName && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.passengers[index].lastName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      {...register(`passengers.${index}.dateOfBirth`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                    {errors.passengers?.[index]?.dateOfBirth && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.passengers[index].dateOfBirth.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown and Submit */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="w-full sm:w-auto text-left">
            <span className="text-xs text-gray-500 uppercase tracking-wider block font-semibold">
              Estimated Total Price
            </span>
            <div className="text-3xl font-black text-blue-600 mt-1">
              ₱{estimatedTotal.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              ₱{flight.basePrice.toLocaleString()} base × {multiplier}x class × {count} passenger(s)
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || flight.availableSeats < count}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-md transition disabled:opacity-50 text-base"
          >
            {submitting ? 'Confirming Reservation...' : 'Confirm & Book Reservation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookFlight;
