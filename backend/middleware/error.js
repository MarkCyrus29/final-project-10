// Global error-handling middleware
// Always answers with { message } and a proper status code
const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode;
  if (!statusCode) {
    statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  }
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose schema validation failed: send the first message
    statusCode = 400;
    message = Object.values(err.errors)[0].message;
  } else if (err.name === 'CastError') {
    // Bad value for a field, e.g. a malformed id
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    // Duplicate value on a unique field (email, flightNumber, ...)
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    const labels = { flightNumber: 'Flight number', email: 'Email', bookingReference: 'Booking reference' };
    message = `${labels[field] || field} already exists`;
  }

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
