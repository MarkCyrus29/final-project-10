const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register new passenger
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { firstName, lastName, email, password, phone, nationality } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Role is always 'passenger' for self-registration
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'passenger',
      phone: phone || '',
      nationality: nationality || ''
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (Authenticated users)
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware without password
    return res.json(req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
