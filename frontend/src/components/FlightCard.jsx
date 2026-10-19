import React from 'react';
import { Link } from 'react-router-dom';

const FlightCard = ({ flight }) => {
  const depDate = new Date(flight.departureTime);
  const arrDate = new Date(flight.arrivalTime);

  const formattedDepTime = depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedArrTime = arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = depDate.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate duration in hours and minutes
  const durationMs = Math.max(0, arrDate - depDate);
  const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Delayed':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 p-6 flex flex-col justify-between">
      <div>
        {/* Top bar: Flight number and Status badge */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-semibold bg-gray-100 text-gray-800 px-2.5 py-1 rounded">
              {flight.flightNumber}
            </span>
            <span className="text-xs text-gray-500 font-medium">{flight.seatClass || 'Economy'}</span>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge(
              flight.status
            )}`}
          >
            {flight.status}
          </span>
        </div>

        {/* Route: Origin -> Destination */}
        <div className="grid grid-cols-3 items-center text-center my-5">
          <div className="text-left">
            <div className="text-2xl font-bold text-gray-900">{flight.origin.code}</div>
            <div className="text-sm font-medium text-gray-600">{flight.origin.city}</div>
            <div className="text-xs text-gray-500 mt-1">{formattedDepTime}</div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 font-medium">
              {durationHrs}h {durationMins}m
            </span>
            <div className="w-full flex items-center justify-center my-1">
              <div className="h-0.5 bg-gray-300 w-full relative">
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-xs">✈</span>
              </div>
            </div>
            <span className="text-xs text-gray-500">Non-stop</span>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{flight.destination.code}</div>
            <div className="text-sm font-medium text-gray-600">{flight.destination.city}</div>
            <div className="text-xs text-gray-500 mt-1">{formattedArrTime}</div>
          </div>
        </div>

        {/* Date and Seats */}
        <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-2">
          <span>📅 {formattedDate}</span>
          <span className={flight.availableSeats > 0 ? 'text-emerald-700 font-medium' : 'text-rose-600 font-semibold'}>
            {flight.availableSeats > 0
              ? `${flight.availableSeats} of ${flight.totalSeats} seats left`
              : 'Sold out'}
          </span>
        </div>
      </div>

      {/* Bottom bar: Price & View Details button */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 block">Starting from</span>
          <span className="text-xl font-extrabold text-blue-600">
            ₱{flight.basePrice.toLocaleString()}
          </span>
        </div>
        <Link
          to={`/flights/${flight._id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default FlightCard;
