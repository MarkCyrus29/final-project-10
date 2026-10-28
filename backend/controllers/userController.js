const { validationResult } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { releaseSeats } = require('../utils/seats');

// True if the logged-in user is the owner of this account or an admin
const canAccess = (req) => {
  return req.user.role === 'admin' || req.user._id.toString() === req.params.id;
};

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get one user by id
// @route   GET /api/users/:id
// @access  Auth (owner or admin)
const getUserById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    if (!canAccess(req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile and/or password
// @route   PUT /api/users/:id
// @access  Auth (owner or admin)
const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    if (!canAccess(req)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only these fields can change. role and email are never read from the body.
    const { firstName, lastName, phone, nationality, currentPassword, newPassword } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (nationality !== undefined) user.nationality = nationality;

    // Changing the password needs the current password, and only the owner knows it
    if (newPassword !== undefined) {
      if (req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ message: 'You can only change your own password' });
      }
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      // The User model hashes this automatically when saving
      user.password = newPassword;
    }

    await user.save();

    // toJSON removes the password from the response
    return res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user account
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    // An admin cannot delete their own account
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 1: give the seats of this user's Confirmed bookings back to their flights
    const confirmedBookings = await Booking.find({ user: user._id, status: 'Confirmed' });
    for (const booking of confirmedBookings) {
      await releaseSeats(booking.flight, booking.passengers.length);
    }

    // Step 2: delete all of this user's bookings
    await Booking.deleteMany({ user: user._id });

    // Step 3: delete the user
    await user.deleteOne();

    return res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
