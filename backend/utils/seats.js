const Flight = require('../models/Flight');

// Take seats from a flight in ONE atomic database step.
// It only succeeds if the flight is Scheduled and still has enough free seats,
// so two bookings made at the same moment can never oversell a flight.
const reserveSeats = (flightId, count) =>
  Flight.findOneAndUpdate(
    { _id: flightId, status: 'Scheduled', availableSeats: { $gte: count } },
    { $inc: { availableSeats: -count } },
    { returnDocument: 'after' }
  );

// Give seats back in ONE atomic step, never going above the plane's total seats.
const releaseSeats = (flightId, count) =>
  Flight.updateOne(
    { _id: flightId },
    [
      {
        $set: {
          availableSeats: { $min: ['$totalSeats', { $add: ['$availableSeats', count] }] }
        }
      }
    ],
    { updatePipeline: true } // Mongoose 9 requires this flag for pipeline-style updates
  );

module.exports = { reserveSeats, releaseSeats };
