const Booking = require('../models/Booking');

// Generates a random 4-character alphanumeric string (letters and digits, uppercase)
const randomChars = (length = 4) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous 0/O, 1/I
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generates unique booking reference in the format BK-YYYY-XXXX (e.g. BK-2026-A1B2)
const generateReference = async () => {
  const year = new Date().getFullYear();
  let reference = '';
  let exists = true;
  let attempts = 0;

  // Retry up to 10 times to prevent collisions
  while (exists && attempts < 10) {
    attempts++;
    reference = `BK-${year}-${randomChars(4)}`;
    const found = await Booking.exists({ bookingReference: reference });
    if (!found) {
      exists = false;
    }
  }

  if (exists) {
    // Fallback with timestamp suffix if extremely dense
    reference = `BK-${year}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  }

  return reference;
};

module.exports = generateReference;
