const { body, param, query } = require('express-validator');
const { WORKFLOW_STATES, ROLES } = require('../models');
const mongoose = require('mongoose');

const loginValidator = [
  body('username').isString().notEmpty().withMessage('Username or email is required.'),
  body('password').isString().notEmpty().withMessage('Password is required.'),
];

const meValidator = [];

module.exports = {
  loginValidator,
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
