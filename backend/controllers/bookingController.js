const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const generateReference = require('../utils/generateReference');

// Seat class price multipliers
const CLASS_MULTIPLIERS = {
  Economy: 1,
  Business: 2,
  'First Class': 3
};

// @desc    Create a new flight booking
// @route   POST /api/bookings
// @access  Passenger only
const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { flightId, seatClass = 'Economy', passengers } = req.body;

    // Verify flight exists and is bookable
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    if (flight.status !== 'Scheduled') {
      return res.status(400).json({
        message: `This flight is currently ${flight.status.toLowerCase()} and cannot be booked`
      });
    }

    // Check available seats
    if (flight.availableSeats < passengers.length) {
      return res.status(400).json({
        message: `Not enough available seats. Only ${flight.availableSeats} seat(s) remaining.`
      });
    }

    // Calculate total price: basePrice * multiplier * passenger count
    const multiplier = CLASS_MULTIPLIERS[seatClass] || 1;
    const totalPrice = flight.basePrice * multiplier * passengers.length;

    // Generate unique booking reference code
    const bookingReference = await generateReference();

    // Create booking document
    const booking = await Booking.create({
      bookingReference,
      user: req.user._id,
      flight: flight._id,
      passengers,
      seatClass,
      totalPrice,
      status: 'Confirmed'
    });

    // Decrement available seats on the flight
    flight.availableSeats -= passengers.length;
    await flight.save();

    // Return populated booking
    await booking.populate('flight');

    return res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings (Admin gets all, Passenger gets own)
// @route   GET /api/bookings
// @access  Authenticated (Admin / Passenger)
const getBookings = async (req, res, next) => {
  try {
    const { flight } = req.query;
    const query = {};

    if (flight) {
      query.flight = flight;
    }

    if (req.user.role === 'admin') {
      // Admin sees all bookings, populating user and flight
      const bookings = await Booking.find(query)
        .populate('user', 'firstName lastName email phone')
        .populate('flight')
        .sort({ bookingDate: -1 });

      return res.json(bookings);
    } else {
      // Passenger sees only their own bookings
      query.user = req.user._id;
      const bookings = await Booking.find(query)
        .populate('flight')
        .sort({ bookingDate: -1 });

      return res.json(bookings);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get one booking by id
// @route   GET /api/bookings/:id
// @access  Authenticated (Owner or Admin only)
const getBookingById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('flight');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check ownership: owner or admin
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view this booking' });
    }

    return res.json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (e.g. mark Completed or Cancelled)
// @route   PUT /api/bookings/:id
// @access  Admin only
const updateBookingStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const oldStatus = booking.status;

    // A cancelled booking has already given its seats back, so it cannot be reopened
    if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
      return res.status(400).json({ message: 'A cancelled booking cannot be changed' });
    }

    booking.status = status;
    await booking.save();

    // If an admin cancels a confirmed booking, restore seats back to flight
    if (oldStatus === 'Confirmed' && status === 'Cancelled') {
      const flight = await Flight.findById(booking.flight);
      if (flight) {
        flight.availableSeats = Math.min(
          flight.totalSeats,
          flight.availableSeats + booking.passengers.length
        );
        await flight.save();
      }
    }

    await booking.populate('user', 'firstName lastName email phone');
    await booking.populate('flight');

    return res.json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking (owner sets status to Cancelled and restores seats)
// @route   DELETE /api/bookings/:id
// @access  Passenger only (Owner)
const cancelBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Owner check
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You can only cancel your own bookings' });
    }

    // Must be confirmed to cancel
    if (booking.status !== 'Confirmed') {
      return res.status(400).json({
        message: `Cannot cancel a booking that is already ${booking.status.toLowerCase()}`
      });
    }

    // Set status to Cancelled (do NOT delete document)
    booking.status = 'Cancelled';
    await booking.save();

    // Restore seats to the flight
    const flight = await Flight.findById(booking.flight);
    if (flight) {
      flight.availableSeats = Math.min(
        flight.totalSeats,
        flight.availableSeats + booking.passengers.length
      );
      await flight.save();
    }

    return res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
};
