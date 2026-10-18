const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { WORKFLOW_STATES, OUTLET_TYPES } = require('../models/Inspection');
const { FINDING_SECTIONS, LIMITS } = require('../config/inspectionFormConfig');
const { COUNTIES } = require('../config/regions');
const { validateDraftPayload } = require('../services/inspectionService');

const FINDING_STATUSES = Array.from(
  new Set(
    FINDING_SECTIONS.flatMap((section) =>
      section.items.flatMap((item) => item.statuses),
    ),
  ),
);

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

const inspectionPayloadValidator = [
  body('inspectionDate')
    .optional({ checkFalsy: true })
    .custom(isIsoDate)
    .withMessage('Inspection date must be a valid ISO date (YYYY-MM-DD).'),
  body('outlet')
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('A valid outlet must be selected.');
      }
      return true;
    }),
  body('formData').optional().isObject().withMessage('Form data must be an object.'),
  body('formData.outletInformation.outletType')
    .optional({ checkFalsy: true })
    .isIn(OUTLET_TYPES)
    .withMessage('Invalid outlet type.'),
  body('formData.outletInformation.county')
    .optional({ checkFalsy: true })
    .isIn(COUNTIES)
    .withMessage('Select a valid county.'),
  body('formData.attendants')
    .optional()
    .isArray()
    .bail()
    .custom((value) => value.length <= LIMITS.maxAttendants)
    .withMessage(`A maximum of ${LIMITS.maxAttendants} attendants may be recorded.`),
  body('formData.findings.*.*.status')
    .optional()
    .isIn(FINDING_STATUSES)
    .withMessage('Invalid finding status.'),
  body('reason')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('A return reason is required and must not exceed 1000 characters.'),
];

const createInspectionValidator = [
  body('outlet')
    .exists({ checkFalsy: true })
    .withMessage('An outlet must be selected.')
    .bail()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('A valid outlet must be selected.');
      }
      return true;
    }),
  ...inspectionPayloadValidator,
];

const inspectionListValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('status').optional().isIn(WORKFLOW_STATES).withMessage('Invalid status filter.'),
  query('county').optional().isIn(COUNTIES).withMessage('Invalid county filter.'),
  query('outletType').optional().isIn(OUTLET_TYPES).withMessage('Invalid outlet type filter.'),
  query('dateFrom').optional().custom(isIsoDate).withMessage('dateFrom must be a valid ISO date.'),
  query('dateTo').optional().custom(isIsoDate).withMessage('dateTo must be a valid ISO date.'),
  query('search').optional().isString().trim().isLength({ max: 120 }).withMessage('Search term is too long.'),
];

const validateObjectId = (field = 'id') => [
  param(field).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid ID.');
    }
    return true;
  }),
];

function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((error) => ({
    field: error.path || error.param,
    message: error.msg,
  }));

  return res.status(400).json({ success: false, message: 'Validation failed.', errors });
}

function validateInspectionPayload(req, res, next) {
  const errors = validateDraftPayload({
    formData: req.body.formData,
    outletId: req.body.outlet,
  });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  return next();
}

module.exports = {
  createInspectionValidator,
  inspectionPayloadValidator,
  inspectionListValidator,
  validateInspectionPayload,
  validateObjectId,
  handleValidationErrors,
  FINDING_STATUSES,
};
