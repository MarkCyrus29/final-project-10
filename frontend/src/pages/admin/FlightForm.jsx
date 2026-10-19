import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

// Validation schema
const schema = yup.object().shape({
  flightNumber: yup.string().trim().required('Flight number is required'),
  originCity: yup.string().trim().required('Origin city is required'),
  originCode: yup
    .string()
    .trim()
    .required('Origin airport code is required')
    .matches(/^[A-Za-z]{3}$/, 'Origin airport code must be 3 letters'),
  destinationCity: yup.string().trim().required('Destination city is required'),
  destinationCode: yup
    .string()
    .trim()
    .required('Destination airport code is required')
    .matches(/^[A-Za-z]{3}$/, 'Destination airport code must be 3 letters'),
  departureTime: yup.string().required('Departure time is required'),
  arrivalTime: yup
    .string()
    .required('Arrival time is required')
    .test('is-after', 'Arrival time must be after departure time', function (value) {
      const { departureTime } = this.parent;
      if (!departureTime || !value) return true;
      return new Date(value) > new Date(departureTime);
    }),
  basePrice: yup
    .number()
    .typeError('Base price must be a number')
    .positive('Base price must be greater than 0')
    .required('Base price is required'),
  totalSeats: yup
    .number()
    .typeError('Total seats must be a number')
    .integer('Total seats must be an integer')
    .min(1, 'Total seats must be at least 1')
    .required('Total seats is required'),
  seatClass: yup.string().oneOf(['Economy', 'Business', 'First Class']).default('Economy'),
  status: yup.string().oneOf(['Scheduled', 'Delayed', 'Cancelled', 'Completed']).default('Scheduled')
});

const FlightForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      seatClass: 'Economy',
      status: 'Scheduled'
    }
  });

  // Convert Date object to datetime-local string (YYYY-MM-DDTHH:MM)
  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isEdit) {
      const fetchFlight = async () => {
        try {
          const response = await api.get(`/api/flights/${id}`);
          const f = response.data;
          reset({
            flightNumber: f.flightNumber,
            originCity: f.origin?.city || '',
            originCode: f.origin?.code || '',
            destinationCity: f.destination?.city || '',
            destinationCode: f.destination?.code || '',
            departureTime: formatDatetimeLocal(f.departureTime),
            arrivalTime: formatDatetimeLocal(f.arrivalTime),
            basePrice: f.basePrice,
            totalSeats: f.totalSeats,
            seatClass: f.seatClass || 'Economy',
            status: f.status || 'Scheduled'
          });
        } catch (err) {
          setServerError(err.response?.data?.message || 'Failed to fetch flight data');
        } finally {
          setLoading(false);
        }
      };

      fetchFlight();
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);

    const payload = {
      flightNumber: data.flightNumber.toUpperCase(),
      origin: {
        city: data.originCity,
        code: data.originCode.toUpperCase()
      },
      destination: {
        city: data.destinationCity,
        code: data.destinationCode.toUpperCase()
      },
      departureTime: new Date(data.departureTime).toISOString(),
      arrivalTime: new Date(data.arrivalTime).toISOString(),
      basePrice: Number(data.basePrice),
      totalSeats: Number(data.totalSeats),
      seatClass: data.seatClass,
      status: data.status
    };

    try {
      if (isEdit) {
        await api.put(`/api/flights/${id}`, payload);
      } else {
        await api.post('/api/flights', payload);
      }
      navigate('/admin/flights');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to save flight');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-3 text-sm text-gray-500">Loading flight details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link to="/admin/flights" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Back to Flight Management
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-2">
          {isEdit ? 'Edit Flight' : 'Add New Flight'}
        </h1>
        <p className="text-sm text-gray-500">
          Fill in the details below to {isEdit ? 'update the' : 'schedule a new'} flight.
        </p>
      </div>

      {serverError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm mb-6">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        {/* Flight Number & Cabin Class */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Flight Number
            </label>
            <input
              type="text"
              placeholder="e.g. PR101"
              {...register('flightNumber')}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {errors.flightNumber && (
              <p className="text-xs text-red-600 mt-1">{errors.flightNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Seat / Cabin Class
            </label>
            <select
              {...register('seatClass')}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Economy">Economy</option>
              <option value="Business">Business</option>
              <option value="First Class">First Class</option>
            </select>
            {errors.seatClass && (
              <p className="text-xs text-red-600 mt-1">{errors.seatClass.message}</p>
            )}
          </div>
        </div>

        {/* Origin */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Origin Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">City Name</label>
              <input
                type="text"
                placeholder="e.g. Manila"
                {...register('originCity')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.originCity && (
                <p className="text-xs text-red-600 mt-1">{errors.originCity.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Airport Code (3 Letters)</label>
              <input
                type="text"
                maxLength={3}
                placeholder="MNL"
                {...register('originCode')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.originCode && (
                <p className="text-xs text-red-600 mt-1">{errors.originCode.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Destination Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">City Name</label>
              <input
                type="text"
                placeholder="e.g. Cebu"
                {...register('destinationCity')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.destinationCity && (
                <p className="text-xs text-red-600 mt-1">{errors.destinationCity.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Airport Code (3 Letters)</label>
              <input
                type="text"
                maxLength={3}
                placeholder="CEB"
                {...register('destinationCode')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.destinationCode && (
                <p className="text-xs text-red-600 mt-1">{errors.destinationCode.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Timings */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Flight Timings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Departure Time</label>
              <input
                type="datetime-local"
                {...register('departureTime')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.departureTime && (
                <p className="text-xs text-red-600 mt-1">{errors.departureTime.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Arrival Time</label>
              <input
                type="datetime-local"
                {...register('arrivalTime')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.arrivalTime && (
                <p className="text-xs text-red-600 mt-1">{errors.arrivalTime.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Capacity, Pricing & Status */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Capacity & Pricing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Base Price (₱)</label>
              <input
                type="number"
                step="any"
                placeholder="2500"
                {...register('basePrice')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.basePrice && (
                <p className="text-xs text-red-600 mt-1">{errors.basePrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Aircraft Seats</label>
              <input
                type="number"
                placeholder="150"
                {...register('totalSeats')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.totalSeats && (
                <p className="text-xs text-red-600 mt-1">{errors.totalSeats.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Flight Status</label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-600 mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
          <Link
            to="/admin/flights"
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Flight' : 'Create Flight'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FlightForm;
