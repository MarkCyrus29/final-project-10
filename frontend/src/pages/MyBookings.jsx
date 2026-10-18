import React from 'react';

const MyBookings = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Bookings</h1>
        <p className="text-gray-600 mb-6">
          View your flight reservations and booking reference codes.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-800">
          Booking history and cancellation features will be fully implemented in Phase 3.
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
