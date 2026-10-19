const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');
const { protect, adminOnly, passengerOnly } = require('../middleware/auth');

const router = express.Router();

const idValidation = [param('id').isMongoId().withMessage('Invalid booking id')];

// Create booking validation
const createBookingValidation = [
  body('flightId').isMongoId().withMessage('Valid flight id is required'),
  body('seatClass')
    .optional()
    .isIn(['Economy', 'Business', 'First Class'])
    .withMessage('Invalid seat class (must be Economy, Business, or First Class)'),
  body('passengers')
    .isArray({ min: 1, max: 9 })
    .withMessage('Must provide between 1 and 9 passengers'),
  body('passengers.*.firstName')
    .trim()
    .notEmpty()
    .withMessage('Passenger first name is required'),
  body('passengers.*.lastName')
    .trim()
    .notEmpty()
    .withMessage('Passenger last name is required'),
  body('passengers.*.dateOfBirth')
    .isISO8601()
    .withMessage('Valid passenger date of birth is required')
    .bail()
    .custom((value) => new Date(value) <= new Date())
    .withMessage('Passenger date of birth cannot be in the future')
];

// Update status validation (Admin)
const updateStatusValidation = [
  ...idValidation,
  body('status')
    .isIn(['Confirmed', 'Cancelled', 'Completed'])
    .withMessage('Status must be Confirmed, Cancelled, or Completed')
];

// Routes
router.post('/', protect, passengerOnly, createBookingValidation, createBooking);
router.get(
  '/',
  protect,
  [query('flight').optional().isMongoId().withMessage('Invalid flight id filter')],
  getBookings
);
router.get('/:id', protect, idValidation, getBookingById);
router.put('/:id', protect, adminOnly, updateStatusValidation, updateBookingStatus);
router.delete('/:id', protect, passengerOnly, idValidation, cancelBooking);

module.exports = router;
