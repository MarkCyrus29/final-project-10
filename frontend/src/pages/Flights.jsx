import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { plural, todayLocalDate } from '../lib/format';

const Flights = () => {
  useDocumentTitle('Find a flight');

  // Filters live in the URL (?origin=&destination=&date=) so the Home quick search,
  // popular routes and the browser back button all land on the same results
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrigin = searchParams.get('origin') || '';
  const urlDestination = searchParams.get('destination') || '';
  const urlDate = searchParams.get('date') || '';

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search filter states (what is typed in the form)
  const [origin, setOrigin] = useState(urlOrigin);
  const [destination, setDestination] = useState(urlDestination);
  const [date, setDate] = useState(urlDate);

  const fetchFlights = async (searchParams = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchParams.origin) params.origin = searchParams.origin;
      if (searchParams.destination) params.destination = searchParams.destination;
      if (searchParams.date) {
        params.date = searchParams.date;
        // Tell the server which time zone "this date" is in, so a 7:45 AM departure
        // shows up under its local date instead of the previous UTC day
        params.tzOffset = new Date().getTimezoneOffset();
      }

      const response = await api.get('/api/flights', { params });
      setFlights(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Whenever the URL filters change, show them in the form and load the matching flights
  useEffect(() => {
    setOrigin(urlOrigin);
    setDestination(urlDestination);
    setDate(urlDate);
    fetchFlights({ origin: urlOrigin, destination: urlDestination, date: urlDate });
  }, [urlOrigin, urlDestination, urlDate]);

  // Put the filters in the URL. If they did not change, just reload the results.
  const applyFilters = (next) => {
    const params = new URLSearchParams();
    if (next.origin) params.set('origin', next.origin);
    if (next.destination) params.set('destination', next.destination);
    if (next.date) params.set('date', next.date);

    if (params.toString() === searchParams.toString()) {
      fetchFlights(next);
    } else {
      setSearchParams(params);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters({ origin: origin.trim(), destination: destination.trim(), date });
  };

  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setDate('');
    applyFilters({ origin: '', destination: '', date: '' });
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
            min={todayLocalDate()}
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
