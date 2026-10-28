import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlaneTakeoff, PlaneLanding, Search, Clock, Tags, Ticket } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { todayLocalDate } from '../lib/format';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

// Shortcuts that open the flight list already filtered
const POPULAR_ROUTES = [
  { from: 'MNL', to: 'CEB', label: 'Manila to Cebu' },
  { from: 'MNL', to: 'SIN', label: 'Manila to Singapore' },
  { from: 'MNL', to: 'DVO', label: 'Manila to Davao' },
  { from: 'CEB', to: 'MNL', label: 'Cebu to Manila' }
];

const HIGHLIGHTS = [
  {
    icon: Clock,
    title: 'Live availability',
    text: 'Every search runs against the current seat count, so what you see is what you can book.'
  },
  {
    icon: Tags,
    title: 'Transparent cabin pricing',
    text: 'Economy, Business and First Class are all priced from the base fare, shown before you commit.'
  },
  {
    icon: Ticket,
    title: 'Instant booking reference',
    text: 'Get a unique reference the moment you book, and manage or cancel from your bookings.'
  }
];

// Build the /flights link for a set of filters
const flightsUrl = ({ origin, destination, date }) => {
  const params = new URLSearchParams();
  if (origin) params.set('origin', origin);
  if (destination) params.set('destination', destination);
  if (date) params.set('date', date);
  const query = params.toString();
  return query ? `/flights?${query}` : '/flights';
};

const Home = () => {
  useDocumentTitle('Book your next flight');
  const navigate = useNavigate();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(flightsUrl({ origin: origin.trim(), destination: destination.trim(), date }));
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-14">
      {/* Hero */}
      <section className="rounded-2xl border border-line bg-accent-soft px-5 py-10 md:px-12 md:py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-5xl">
            Book your next flight in a minute.
          </h1>
          <p className="mt-4 text-base text-ink-muted md:text-lg">
            Search live availability, compare cabin classes, and manage every reservation in one place.
          </p>
        </div>

        {/* Quick search */}
        <Card className="mt-8 p-4 md:p-5">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_11rem_auto] md:items-end"
          >
            <Input
              label="From"
              placeholder="City or code, e.g. MNL"
              icon={PlaneTakeoff}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
            <Input
              label="To"
              placeholder="City or code, e.g. CEB"
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
            <Button type="submit" icon={Search} size="md" className="w-full md:w-auto">
              Search flights
            </Button>
          </form>
        </Card>

        {/* Popular routes */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Popular routes:</span>
          {POPULAR_ROUTES.map((route) => (
            <Link
              key={`${route.from}-${route.to}`}
              to={flightsUrl({ origin: route.from, destination: route.to })}
              className="rounded-full border border-line-strong bg-surface px-3 py-1 text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {route.from} → {route.to}
            </Link>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Icon size={18} aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <p className="text-sm text-ink-muted">{text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default Home;
