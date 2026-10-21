import React, { useState, useEffect } from 'react';
import { PlaneTakeoff, PlaneLanding, Search, SearchX } from 'lucide-react';
import api from '../api/axios';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import FlightCard from '../components/FlightCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { FlightCardSkeleton } from '../components/ui/Skeleton';
import { plural } from '../lib/format';

const Flights = () => {
  useDocumentTitle('Find a flight');

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

  const hasFilters = Boolean(origin || destination || date);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <PageHeader
        title="Find a flight"
        description="Search by city or airport code."
      />

      {error && (
        <div className="mb-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Search panel */}
      <Card className="mb-6 p-4 md:p-5">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_11rem_auto] md:items-end"
        >
          <Input
            label="From"
            placeholder="City or code, e.g. Manila"
            icon={PlaneTakeoff}
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />

          <Input
            label="To"
            placeholder="City or code, e.g. Cebu"
            icon={PlaneLanding}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />

          <Input
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              icon={Search}
              className="flex-1 md:flex-none"
            >
              Search
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Results / Loading / Empty */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <FlightCardSkeleton key={i} />
          ))}
        </div>
      ) : flights.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No flights found"
          description="Try a different city or date, or clear your filters."
          action={
            <Button variant="secondary" onClick={handleReset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div>
          <div className="mb-3 text-sm text-ink-muted">
            {plural(flights.length, 'flight')}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
