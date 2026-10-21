import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice, formatDate, formatTime, plural } from '../lib/format';
import { Button, ButtonLink } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { DetailSkeleton } from '../components/ui/Skeleton';

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

  useDocumentTitle(flight ? `Book flight · ${flight.flightNumber}` : 'Book flight');

  const {
    register,
    control,
    handleSubmit,
    watch,
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error && !flight) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EmptyState
          icon={AlertCircle}
          title="Flight unavailable"
          description={error}
          action={
            <ButtonLink to="/flights" variant="secondary">
              Back to flights
            </ButtonLink>
          }
        />
      </div>
    );
  }

  // Confirmation view after booking
  if (bookingResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 sm:p-12 text-center space-y-6">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Reservation confirmed</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Thank you for booking with us. Your reservation is safely secured in our system.
            </p>
          </div>

          {/* Reference badge */}
          <div className="my-6 bg-canvas border-2 border-dashed border-line-strong rounded-lg p-6 max-w-sm mx-auto">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider block mb-1">
              Booking reference
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-accent block">
              {bookingResult.bookingReference}
            </span>
            <p className="text-xs text-ink-muted mt-2">
              Save this reference code to view or manage your reservation anytime.
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-canvas rounded-lg p-5 text-left max-w-md mx-auto text-sm space-y-2.5 border border-line">
            <div className="flex justify-between">
              <span className="text-ink-muted">Flight</span>
              <span className="font-semibold text-ink font-mono">
                {flight.flightNumber} ({flight.origin.code} → {flight.destination.code})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Cabin class</span>
              <span className="font-semibold text-ink">{bookingResult.seatClass}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Passengers</span>
              <span className="font-semibold text-ink">
                {bookingResult.passengers?.length} {plural(bookingResult.passengers?.length || 1, 'passenger', 'passengers')}
              </span>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5">
              <span className="text-ink font-semibold">Total price</span>
              <span className="font-bold text-lg font-mono text-accent">
                {formatPrice(bookingResult.totalPrice)}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <ButtonLink to="/my-bookings" variant="primary">
              View my bookings
            </ButtonLink>
            <ButtonLink to="/flights" variant="secondary">
              Book another flight
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate pricing
  const multiplier = MULTIPLIERS[selectedClass] || 1;
  const count = watchedPassengers.length || 1;
  const estimatedTotal = (flight?.basePrice || 0) * multiplier * count;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <ButtonLink to={`/flights/${flight._id}`} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to flight details
        </ButtonLink>
        <h1 className="text-2xl font-bold tracking-tight text-ink mt-3">Book your flight</h1>
        <p className="text-sm text-ink-muted">Enter passenger information and confirm your reservation.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Flight summary card */}
      <Card className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-ink">
              {flight.flightNumber}
            </span>
            <span className="text-base font-semibold text-ink">
              {flight.origin.city} ({flight.origin.code}) → {flight.destination.city} ({flight.destination.code})
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            {formatDate(flight.departureTime)} at {formatTime(flight.departureTime)}
          </p>
        </div>

        <div className="sm:text-right">
          <span className="text-xs text-ink-muted block">Base fare</span>
          <span className="text-lg font-bold font-mono text-ink">
            {formatPrice(flight.basePrice)}
          </span>
          <span className="text-xs text-ink-muted block mt-0.5">
            {flight.availableSeats} {plural(flight.availableSeats, 'seat', 'seats')} available
          </span>
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Class and Passenger Count selection */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink">1. Booking options</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Cabin class"
              id="seatClass"
              {...register('seatClass')}
            >
              <option value="Economy">Economy (1× base price)</option>
              <option value="Business">Business (2× base price)</option>
              <option value="First Class">First Class (3× base price)</option>
            </Select>

            <Select
              label="Number of passengers"
              id="passengerCount"
              value={fields.length}
              onChange={(e) => handlePassengerCountChange(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <option key={num} value={num} disabled={num > flight.availableSeats}>
                  {num} {plural(num, 'passenger', 'passengers')} {num > flight.availableSeats ? '(not enough seats)' : ''}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Passenger Information Forms */}
        <Card className="p-6 space-y-6">
          <h2 className="text-base font-semibold text-ink">2. Passenger information</h2>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className={index > 0 ? 'pt-6 border-t border-line space-y-4' : 'space-y-4'}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Passenger #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-danger hover:text-danger"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="First name"
                    id={`passengers.${index}.firstName`}
                    placeholder="e.g. Juan"
                    error={errors.passengers?.[index]?.firstName?.message}
                    {...register(`passengers.${index}.firstName`)}
                  />

                  <Input
                    label="Last name"
                    id={`passengers.${index}.lastName`}
                    placeholder="e.g. Dela Cruz"
                    error={errors.passengers?.[index]?.lastName?.message}
                    {...register(`passengers.${index}.lastName`)}
                  />

                  <Input
                    label="Date of birth"
                    id={`passengers.${index}.dateOfBirth`}
                    type="date"
                    error={errors.passengers?.[index]?.dateOfBirth?.message}
                    {...register(`passengers.${index}.dateOfBirth`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Price Breakdown and Submit */}
        <Card className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider block">
              Estimated total price
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-accent mt-1">
              {formatPrice(estimatedTotal)}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {formatPrice(flight.basePrice)} base × {multiplier}× class × {count} {plural(count, 'passenger', 'passengers')}
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={flight.availableSeats < count}
            className="w-full sm:w-auto"
          >
            Confirm reservation
          </Button>
        </Card>
      </form>
    </div>
  );
};

export default BookFlight;
