const { validationResult } = require('express-validator');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');

// Fields an admin is allowed to set on a flight
const flightFields = [
  'flightNumber',
  'origin',
  'destination',
  'departureTime',
  'arrivalTime',
  'basePrice',
  'totalSeats',
  'availableSeats',
  'seatClass',
  'status'
];

// Escape special characters so user text is safe inside a RegExp
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive exact match on city or airport code
const placeFilter = (field, text) => {
  const regex = new RegExp(`^${escapeRegex(text.trim())}$`, 'i');
  return { $or: [{ [`${field}.city`]: regex }, { [`${field}.code`]: regex }] };
};

// @desc    Get flights (supports ?origin=&destination=&date=&all=true)
// @route   GET /api/flights
// @access  Public
const getFlights = async (req, res, next) => {
  try {
    const { origin, destination, date, all } = req.query;
    const conditions = [];

    // Cancelled flights are hidden unless ?all=true (used by the admin list)
    if (all !== 'true') {
      conditions.push({ status: { $ne: 'Cancelled' } });
    }

    if (typeof origin === 'string' && origin.trim()) {
      conditions.push(placeFilter('origin', origin));
    }

    if (typeof destination === 'string' && destination.trim()) {
      conditions.push(placeFilter('destination', destination));
    }

    // date = same calendar day (UTC) as departureTime, e.g. 2026-11-05
    if (typeof date === 'string' && date.trim()) {
      const start = new Date(date);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: 'Invalid date, use YYYY-MM-DD' });
      }
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      conditions.push({ departureTime: { $gte: start, $lt: end } });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};
    const flights = await Flight.find(filter).sort({ departureTime: 1 });

    return res.json(flights);
  } catch (error) {
    next(error);
  }
};

// @desc    Get one flight by id
// @route   GET /api/flights/:id
// @access  Public
const getFlightById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    return res.json(flight);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a flight
// @route   POST /api/flights
// @access  Admin
const createFlight = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const data = {};
    flightFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    });

    // New flights start with every seat free unless told otherwise
    if (data.availableSeats === undefined) {
      data.availableSeats = data.totalSeats;
    }

    const flight = await Flight.create(data);
    return res.status(201).json(flight);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a flight (schedule, price, status, seats)
// @route   PUT /api/flights/:id
// @access  Admin
const updateFlight = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    const oldTotalSeats = flight.totalSeats;

    flightFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        flight[field] = req.body[field];
      }
    });

    // If total seats changed but available seats were not sent,
    // move available seats by the same amount
    if (req.body.totalSeats !== undefined && req.body.availableSeats === undefined) {
      flight.availableSeats += flight.totalSeats - oldTotalSeats;
    }

    // save() runs all schema validation on the whole flight
    await flight.save();
    return res.json(flight);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a flight
// @route   DELETE /api/flights/:id
// @access  Admin
const deleteFlight = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    // Do not delete a flight that has bookings, so booking history keeps its flight
    const hasBookings = await Booking.exists({ flight: flight._id });
    if (hasBookings) {
      return res.status(400).json({
        message: 'This flight has bookings. Set its status to Cancelled instead of deleting it.'
      });
    }

    await flight.deleteOne();
    return res.json({ message: 'Flight deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight
};
