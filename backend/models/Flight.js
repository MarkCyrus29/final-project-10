const mongoose = require('mongoose');

// Small schema reused for origin and destination
const locationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Airport code is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'Airport code must be 3 letters (e.g. MNL)']
    }
  },
  { _id: false }
);

// Flight schema definition
const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: [true, 'Flight number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  origin: {
    type: locationSchema,
    required: [true, 'Origin is required']
  },
  destination: {
    type: locationSchema,
    required: [true, 'Destination is required']
  },
  departureTime: {
    type: Date,
    required: [true, 'Departure time is required']
  },
  arrivalTime: {
    type: Date,
    required: [true, 'Arrival time is required'],
    validate: {
      // Arrival must be after departure
      validator: function (value) {
        return !this.departureTime || value > this.departureTime;
      },
      message: 'Arrival time must be after departure time'
    }
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    validate: {
      validator: (value) => value > 0,
      message: 'Base price must be greater than 0'
    }
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Total seats must be at least 1']
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative'],
    validate: {
      // Cannot have more free seats than the plane has
      validator: function (value) {
        return value <= this.totalSeats;
      },
      message: 'Available seats cannot be more than total seats'
    }
  },
  seatClass: {
    type: String,
    enum: ['Economy', 'Business', 'First Class'],
    default: 'Economy'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Delayed', 'Cancelled', 'Completed'],
    default: 'Scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;
