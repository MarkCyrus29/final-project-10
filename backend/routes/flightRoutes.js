const express = require('express');
const { body, param } = require('express-validator');
const {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight
} = require('../controllers/flightController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const seatClasses = ['Economy', 'Business', 'First Class'];
const statuses = ['Scheduled', 'Delayed', 'Cancelled', 'Completed'];

// Check that :id looks like a MongoDB id
const idValidation = [param('id').isMongoId().withMessage('Invalid flight id')];

// Validation rules for adding a flight (every main field is required)
const createValidation = [
  body('flightNumber').trim().notEmpty().withMessage('Flight number is required'),
  body('origin.city').trim().notEmpty().withMessage('Origin city is required'),
  body('origin.code').trim().notEmpty().withMessage('Origin airport code is required'),
  body('destination.city').trim().notEmpty().withMessage('Destination city is required'),
  body('destination.code').trim().notEmpty().withMessage('Destination airport code is required'),
  body('departureTime').isISO8601().withMessage('Valid departure time is required'),
  body('arrivalTime').isISO8601().withMessage('Valid arrival time is required'),
  body('basePrice').isFloat({ gt: 0 }).withMessage('Base price must be greater than 0'),
  body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be a whole number of at least 1'),
  body('availableSeats')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available seats must be a whole number of 0 or more'),
  body('seatClass').optional().isIn(seatClasses).withMessage('Invalid seat class'),
  body('status').optional().isIn(statuses).withMessage('Invalid status')
];

// Validation rules for editing a flight (every field is optional)
const updateValidation = [
  ...idValidation,
  body('flightNumber').optional().trim().notEmpty().withMessage('Flight number cannot be empty'),
  body('origin.city').optional().trim().notEmpty().withMessage('Origin city cannot be empty'),
  body('origin.code').optional().trim().notEmpty().withMessage('Origin airport code cannot be empty'),
  body('destination.city').optional().trim().notEmpty().withMessage('Destination city cannot be empty'),
  body('destination.code').optional().trim().notEmpty().withMessage('Destination airport code cannot be empty'),
  body('departureTime').optional().isISO8601().withMessage('Invalid departure time'),
  body('arrivalTime').optional().isISO8601().withMessage('Invalid arrival time'),
  body('basePrice').optional().isFloat({ gt: 0 }).withMessage('Base price must be greater than 0'),
  body('totalSeats').optional().isInt({ min: 1 }).withMessage('Total seats must be a whole number of at least 1'),
  body('availableSeats')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available seats must be a whole number of 0 or more'),
  body('seatClass').optional().isIn(seatClasses).withMessage('Invalid seat class'),
  body('status').optional().isIn(statuses).withMessage('Invalid status')
];

// Public routes
router.get('/', getFlights);
router.get('/:id', idValidation, getFlightById);

// Admin routes
router.post('/', protect, adminOnly, createValidation, createFlight);
router.put('/:id', protect, adminOnly, updateValidation, updateFlight);
router.delete('/:id', protect, adminOnly, idValidation, deleteFlight);

module.exports = router;
