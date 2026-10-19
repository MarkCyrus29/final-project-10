const express = require('express');
const { body, param } = require('express-validator');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Check that :id looks like a MongoDB id
const idValidation = [param('id').isMongoId().withMessage('Invalid user id')];

// Validation rules for updating a profile (all fields optional)
const updateValidation = [
  ...idValidation,
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isString().withMessage('Phone must be text').trim(),
  body('nationality').optional().isString().withMessage('Nationality must be text').trim(),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, idValidation, getUserById);
router.put('/:id', protect, updateValidation, updateUser);
router.delete('/:id', protect, adminOnly, idValidation, deleteUser);

module.exports = router;
