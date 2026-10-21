import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Users, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatPrice, formatDate, formatTime } from '../../lib/format';
import { Button, ButtonLink, IconButton } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { DataTable } from '../../components/ui/DataTable';
import { TableSkeleton } from '../../components/ui/Skeleton';

const ManageFlights = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  useDocumentTitle('Manage flights');

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
    const ok = await confirm({
      title: 'Delete flight',
      description: `Are you sure you want to delete flight ${flightNumber}? This action cannot be undone.`,
      confirmText: 'Delete flight',
      variant: 'danger'
    });

    if (!ok) return;

    try {
      await api.delete(`/api/flights/${id}`);
      toast.success(`Flight ${flightNumber} deleted successfully.`);
      setFlights((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete flight.');
    }
  };

  const columns = [
    {
      header: 'Flight #',
      accessorKey: 'flightNumber',
      cell: (flight) => (
        <span className="font-mono font-semibold text-ink">
          {flight.flightNumber}
        </span>
      )
    },
    {
      header: 'Route',
      cell: (flight) => (
        <div>
          <div className="font-medium text-ink">
            {flight.origin.code} <span className="text-ink-muted">→</span> {flight.destination.code}
          </div>
          <div className="text-xs text-ink-muted">
            {flight.origin.city} to {flight.destination.city}
          </div>
        </div>
      )
    },
    {
      header: 'Departure',
      cell: (flight) => (
        <div>
          <div className="text-ink">{formatDate(flight.departureTime)}</div>
          <div className="text-xs text-ink-muted">{formatTime(flight.departureTime)}</div>
        </div>
      )
    },
    {
      header: 'Arrival',
      cell: (flight) => (
        <div>
          <div className="text-ink">{formatDate(flight.arrivalTime)}</div>
          <div className="text-xs text-ink-muted">{formatTime(flight.arrivalTime)}</div>
        </div>
      )
    },
    {
      header: 'Price',
      cell: (flight) => (
        <span className="font-mono font-medium text-ink">
          {formatPrice(flight.basePrice)}
        </span>
      )
    },
    {
      header: 'Seats',
      cell: (flight) => (
        <span>
          <span className="font-medium text-ink">{flight.availableSeats}</span>
          <span className="text-xs text-ink-muted"> / {flight.totalSeats}</span>
        </span>
      )
    },
    {
      header: 'Status',
      cell: (flight) => <StatusBadge status={flight.status} />
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (flight) => (
        <div className="flex items-center justify-end gap-1">
          <ButtonLink
            to={`/admin/flights/${flight._id}/manifest`}
            variant="ghost"
            size="sm"
            aria-label="Manifest"
            title="Manifest"
          >
            Manifest
          </ButtonLink>
          <ButtonLink
            to={`/admin/flights/${flight._id}/edit`}
            variant="ghost"
            size="sm"
            aria-label="Edit"
            title="Edit"
          >
            Edit
          </ButtonLink>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(flight._id, flight.flightNumber)}
            className="text-danger hover:text-danger"
            aria-label="Delete"
            title="Delete"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <ButtonLink to="/admin" variant="ghost" size="sm" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Admin dashboard
        </ButtonLink>
        <PageHeader
          title="Flight management"
          description="Manage all airline flights, schedules, and capacities."
          action={
            <ButtonLink to="/admin/flights/new" variant="primary">
              + Add new flight
            </ButtonLink>
          }
        />
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Card className="p-6">
          <TableSkeleton rows={6} cols={8} />
        </Card>
      ) : flights.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No flights registered"
          description="No flight schedules have been registered in the system yet."
          action={
            <ButtonLink to="/admin/flights/new" variant="primary">
              Create the first flight
            </ButtonLink>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            data={flights}
            keyField="_id"
            mobileCard={(flight) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-ink">
                    {flight.flightNumber}
                  </span>
                  <StatusBadge status={flight.status} />
                </div>
                <div className="text-sm">
                  <span className="font-medium text-ink">
                    {flight.origin.code} → {flight.destination.code}
                  </span>
                  <span className="text-xs text-ink-muted block">
                    {flight.origin.city} to {flight.destination.city}
                  </span>
                </div>
                <div className="text-xs text-ink-muted">
                  Dep: {formatDate(flight.departureTime)} at {formatTime(flight.departureTime)}
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-line">
                  <span className="font-mono font-medium text-ink">
                    {formatPrice(flight.basePrice)}
                  </span>
                  <span className="text-ink-muted">
                    {flight.availableSeats} of {flight.totalSeats} seats
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                  <ButtonLink
                    to={`/admin/flights/${flight._id}/manifest`}
                    variant="secondary"
                    size="sm"
                  >
                    Manifest
                  </ButtonLink>
                  <ButtonLink
                    to={`/admin/flights/${flight._id}/edit`}
                    variant="secondary"
                    size="sm"
                  >
                    Edit
                  </ButtonLink>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(flight._id, flight.flightNumber)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default ManageFlights;
