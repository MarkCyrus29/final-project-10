import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { DetailSkeleton } from '../../components/ui/Skeleton';

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
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useDocumentTitle(isEdit ? 'Edit flight' : 'Add new flight');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      seatClass: 'Economy',
      status: 'Scheduled'
    }
  });

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
        toast.success('Flight updated successfully.');
      } else {
        await api.post('/api/flights', payload);
        toast.success('Flight created successfully.');
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <ButtonLink to="/admin/flights" variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to flight management
        </ButtonLink>
        <h1 className="text-2xl font-bold tracking-tight text-ink mt-3">
          {isEdit ? 'Edit flight' : 'Add new flight'}
        </h1>
        <p className="text-sm text-ink-muted">
          Fill in the details below to {isEdit ? 'update the' : 'schedule a new'} flight.
        </p>
      </div>

      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="p-6 sm:p-8 space-y-6">
          {/* Flight number. Every flight is sold in all three cabin classes (priced from the
              base fare), so there is no per-flight cabin class to choose here. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Flight number"
              id="flightNumber"
              placeholder="e.g. PR101"
              error={errors.flightNumber?.message}
              {...register('flightNumber')}
            />
          </div>

          {/* Origin */}
          <div className="border-t border-line pt-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Origin location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="City name"
                  id="originCity"
                  placeholder="e.g. Manila"
                  error={errors.originCity?.message}
                  {...register('originCity')}
                />
              </div>
              <div>
                <Input
                  label="Airport code (3 letters)"
                  id="originCode"
                  maxLength={3}
                  placeholder="MNL"
                  error={errors.originCode?.message}
                  {...register('originCode')}
                />
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="border-t border-line pt-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Destination location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="City name"
                  id="destinationCity"
                  placeholder="e.g. Cebu"
                  error={errors.destinationCity?.message}
                  {...register('destinationCity')}
                />
              </div>
              <div>
                <Input
                  label="Airport code (3 letters)"
                  id="destinationCode"
                  maxLength={3}
                  placeholder="CEB"
                  error={errors.destinationCode?.message}
                  {...register('destinationCode')}
                />
              </div>
            </div>
          </div>

          {/* Schedule Timings */}
          <div className="border-t border-line pt-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Flight timings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Departure time"
                id="departureTime"
                type="datetime-local"
                error={errors.departureTime?.message}
                {...register('departureTime')}
              />

              <Input
                label="Arrival time"
                id="arrivalTime"
                type="datetime-local"
                error={errors.arrivalTime?.message}
                {...register('arrivalTime')}
              />
            </div>
          </div>

          {/* Capacity, Pricing & Status */}
          <div className="border-t border-line pt-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Capacity and pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Base price (₱)"
                id="basePrice"
                type="number"
                step="any"
                placeholder="2500"
                error={errors.basePrice?.message}
                {...register('basePrice')}
              />

              <Input
                label="Total aircraft seats"
                id="totalSeats"
                type="number"
                placeholder="150"
                error={errors.totalSeats?.message}
                {...register('totalSeats')}
              />

              <Select
                label="Flight status"
                id="status"
                value={watch('status')}
                onChange={(e) => setValue('status', e.target.value, { shouldValidate: true })}
                error={errors.status?.message}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end items-center gap-3 pt-6 border-t border-line">
            <ButtonLink
              to="/admin/flights"
              variant="secondary"
            >
              Cancel
            </ButtonLink>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              {isEdit ? 'Update flight' : 'Create flight'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default FlightForm;
