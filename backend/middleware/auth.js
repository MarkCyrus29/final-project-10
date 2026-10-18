const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify Bearer token and attach user to request
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user without password
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Restrict route to admin role only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admin only' });
};

// Restrict route to passenger role only
const passengerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'passenger') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Passenger only' });
};

module.exports = {
  protect,
  adminOnly,
  passengerOnly
};
