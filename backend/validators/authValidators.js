const { body, param, query } = require('express-validator');
const { WORKFLOW_STATES, ROLES } = require('../models');
const mongoose = require('mongoose');

const loginValidator = [
  body('username').isString().notEmpty().withMessage('Username or email is required.'),
  body('password').isString().notEmpty().withMessage('Password is required.'),
];

const registerValidator = [
  body('name').isString().trim().notEmpty().withMessage('Full name is required.')
    .isLength({ max: 100 }).withMessage('Name must not exceed 100 characters.'),
  body('email').isString().trim().notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('username').isString().trim().notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters.')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Username may only contain letters, numbers, dots, underscores and hyphens.'),
  body('password').isString().notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
];

const forgotPasswordValidator = [
  body('email').isString().trim().notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
];

const resetPasswordValidator = [
  body('token').isString().trim().notEmpty().withMessage('Reset token is required.'),
  body('password').isString().notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
];

const meValidator = [];

module.exports = {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  meValidator,
  validateObjectId: (field = 'id') => [
    param(field).custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ID.');
      }
      return true;
    }),
  ],
  handleValidationErrors: (req, res, next) => {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
};
