import React from 'react';

const Flights = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Available Flights</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the Airline Reservation System. Browse and search for upcoming flights.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-blue-800">
          Flight search and booking cards will be fully implemented in Phase 2.
        </div>
      </div>
    </div>
  );
};

export default Flights;
