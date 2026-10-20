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

/**
 * Coordinates are stored as strings. Round to 7 decimal places (~1 cm) and
 * normalise the representation so a device fix never lands in exponential
 * notation.
 */
function sanitizeCoordinate(value) {
  if (value === undefined || value === null || value === '') return value;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) return value;
  return String(Number(parsed.toFixed(7)));
}

function isValidLatitude(value) {
  if (value === undefined || value === null || value === '') return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= -90 && parsed <= 90;
}

function isValidLongitude(value) {
  if (value === undefined || value === null || value === '') return true;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= -180 && parsed <= 180;
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
  body('latitude')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeCoordinate)
    .custom(isValidLatitude)
    .withMessage('Latitude must be a number between -90 and 90.'),
  body('longitude')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeCoordinate)
    .custom(isValidLongitude)
    .withMessage('Longitude must be a number between -180 and 180.'),
  body('locationSource')
    .optional({ checkFalsy: true })
    .customSanitizer(sanitizeString)
    .isLength({ max: 30 })
    .withMessage('Location source must not exceed 30 characters.'),
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