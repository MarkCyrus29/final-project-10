const mongoose = require('mongoose');

// Booking schema definition (fields follow context.md)
const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    required: [true, 'Booking reference is required'],
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: [true, 'Flight is required']
  },
  passengers: [
    {
      firstName: { type: String, required: [true, 'Passenger first name is required'], trim: true },
      lastName: { type: String, required: [true, 'Passenger last name is required'], trim: true },
      dateOfBirth: { type: Date, required: [true, 'Passenger date of birth is required'] }
    }
  ],
  seatClass: {
    type: String,
    enum: ['Economy', 'Business', 'First Class'],
    default: 'Economy'
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'Completed'],
    default: 'Confirmed'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
