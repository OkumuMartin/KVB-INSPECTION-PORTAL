const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const { ROLES, STATUSES } = require('../models');

const createUserValidator = [
  body('name').notEmpty().trim().isLength({ max: 100 }).withMessage('Name is required and must not exceed 100 characters.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  body('username').notEmpty().trim().isLength({ max: 50 }).withMessage('Username is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('role').isIn(ROLES).withMessage('Invalid role.'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status.'),
];

const updateUserValidator = [
  param('id').custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid user ID.');
    }
    return true;
  }),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name must not exceed 100 characters.'),
  body('email').optional().isEmail().withMessage('Invalid email address.'),
  body('username').optional().trim().isLength({ max: 50 }).withMessage('Username must not exceed 50 characters.'),
  body('role').optional().isIn(ROLES).withMessage('Invalid role.'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status.'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
];

const statusValidator = [
  param('id').custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid user ID.');
    }
    return true;
  }),
  body('status').isIn(STATUSES).withMessage('Invalid status.'),
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  statusValidator,
  handleValidationErrors: (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
};
