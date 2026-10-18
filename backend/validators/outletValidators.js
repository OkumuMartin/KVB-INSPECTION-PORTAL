const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const { OUTLET_TYPES } = require('../models');

const MARKUP_PATTERN = /<\s*\/?\s*[a-z][^>]*>|<\s*script|javascript\s*:|on(?:error|load|click|mouseover)\s*=/i;

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  if (MARKUP_PATTERN.test(value)) {
    throw new Error('HTML/script payloads are not allowed.');
  }
  return value.trim();
}

const outletValidator = [
  body('outletName')
    .customSanitizer(sanitizeString)
    .notEmpty()
    .isLength({ max: 150 })
    .withMessage('Outlet name is required and must not exceed 150 characters.'),
  body('outletType').isIn(OUTLET_TYPES).withMessage('Invalid outlet type.'),
  body('outletTypeOther')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeString)
    .isLength({ max: 100 })
    .withMessage('Other outlet type must not exceed 100 characters.'),
  body('ownerName')
    .customSanitizer(sanitizeString)
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Owner name is required.'),
  body('ownerTrainingLevel')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeString)
    .isLength({ max: 150 })
    .withMessage('Level of training must not exceed 150 characters.'),
  body('ownerEmail').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address.'),
  body('ownerPhone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Phone must not exceed 30 characters.'),
  body('address')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeString)
    .isLength({ max: 300 })
    .withMessage('Address must not exceed 300 characters.'),
  body('county')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeString)
    .isLength({ max: 80 })
    .withMessage('County must not exceed 80 characters.'),
  body('subCounty')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeString)
    .isLength({ max: 80 })
    .withMessage('Sub-county must not exceed 80 characters.'),
  body('centre')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeString)
    .isLength({ max: 80 })
    .withMessage('Centre must not exceed 80 characters.'),
  body('kvbRegistrationInfo')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeString)
    .isLength({ max: 100 })
    .withMessage('KVB registration info must not exceed 100 characters.'),
];

module.exports = {
  outletValidator,
  validateObjectId: (field = 'id') => [
    param(field).custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ID.');
      }
      return true;
    }),
  ],
  handleValidationErrors: (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
};