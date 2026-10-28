const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const generateReference = require('../utils/generateReference');
const { reserveSeats, releaseSeats } = require('../utils/seats');
const { calculateTotalPrice } = require('../utils/pricing');

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

    if (new Date(flight.departureTime) <= new Date()) {
      return res.status(400).json({
        message: 'This flight has already departed and cannot be booked'
      });
    }

    // Check available seats
    if (flight.availableSeats < passengers.length) {
      return res.status(400).json({
        message: `Not enough available seats. Only ${flight.availableSeats} seat(s) remaining.`
      });
    }

    // Calculate total price: basePrice * multiplier * passenger count
    const totalPrice = calculateTotalPrice(flight.basePrice, seatClass, passengers.length);

    // Generate unique booking reference code
    const bookingReference = await generateReference();

    // Take the seats first, in one atomic step. If someone else grabbed them
    // after the check above, this fails instead of overselling the flight.
    const reserved = await reserveSeats(flight._id, passengers.length);
    if (!reserved) {
      const latest = await Flight.findById(flight._id).select('availableSeats');
      return res.status(400).json({
        message: `Not enough available seats. Only ${latest ? latest.availableSeats : 0} seat(s) remaining.`
      });
    }

    // Create booking document. If this fails, give the seats back.
    let booking;
    try {
      booking = await Booking.create({
        bookingReference,
        user: req.user._id,
        flight: flight._id,
        passengers,
        seatClass,
        totalPrice,
        status: 'Confirmed'
      });
    } catch (createError) {
      await releaseSeats(flight._id, passengers.length);
      throw createError;
    }

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

    // Change the status only if it is still what we just read. This stops two
    // requests (e.g. passenger and admin cancelling together) from both releasing seats.
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: oldStatus },
      { status },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) {
      return res.status(409).json({ message: 'This booking was just changed. Please refresh and try again.' });
    }

    // If an admin cancels a confirmed booking, restore seats back to flight
    if (oldStatus === 'Confirmed' && status === 'Cancelled') {
      await releaseSeats(updated.flight, updated.passengers.length);
    }

    await updated.populate('user', 'firstName lastName email phone');
    await updated.populate('flight');

    return res.json(updated);
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

    // Set status to Cancelled (do NOT delete document). The status check inside the
    // update means a double click or a second request cannot release the seats twice.
    const cancelled = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'Confirmed' },
      { status: 'Cancelled' },
      { returnDocument: 'after' }
    );
    if (!cancelled) {
      return res.status(400).json({ message: 'This booking is no longer active and cannot be cancelled' });
    }

    // Restore seats to the flight
    await releaseSeats(cancelled.flight, cancelled.passengers.length);

    return res.json({
      message: 'Booking cancelled successfully',
      booking: cancelled
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
