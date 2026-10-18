const express = require('express');
const { query } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createInspectionValidator,
  inspectionPayloadValidator,
  inspectionListValidator,
  validateInspectionPayload,
  validateObjectId,
  handleValidationErrors,
} = require('../validators/inspectionValidators');
const {
  listInspections,
  getInspection,
  createInspection,
  updateInspection,
  deleteInspection,
  submitInspection,
  returnInspection,
  revertInspection,
  directorApprove,
  finalApprove,
  generatePdf,
  exportInspection,
  exportReports,
  getInspectionAuditLog,
  listComments,
  addComment,
} = require('../controllers/inspectionController');

const router = express.Router();

const auditLogQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];

router.get('/', requireAuth, inspectionListValidator, handleValidationErrors, listInspections);
router.get('/search', requireAuth, inspectionListValidator, handleValidationErrors, listInspections);

router.post(
  '/',
  requireAuth,
  requireRole('INSPECTOR'),
  createInspectionValidator,
  handleValidationErrors,
  validateInspectionPayload,
  createInspection,
);

router.get('/:id', requireAuth, validateObjectId(), handleValidationErrors, getInspection);
router.get('/:id/pdf', requireAuth, validateObjectId(), handleValidationErrors, generatePdf);
router.get('/:id/export', requireAuth, validateObjectId(), handleValidationErrors, exportInspection);
router.get('/export', requireAuth, handleValidationErrors, exportReports);
router.get('/:id/audit-log', requireAuth, validateObjectId(), auditLogQueryValidator, handleValidationErrors, getInspectionAuditLog);
router.get('/:id/comments', requireAuth, validateObjectId(), handleValidationErrors, listComments);
router.post('/:id/comments', requireAuth, validateObjectId(), handleValidationErrors, addComment);

router.put(
  '/:id',
  requireAuth,
  requireRole('INSPECTOR', 'SYSTEM_ADMIN'),
  validateObjectId(),
  inspectionPayloadValidator,
  handleValidationErrors,
  validateInspectionPayload,
  updateInspection,
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('INSPECTOR', 'SYSTEM_ADMIN'),
  validateObjectId(),
  inspectionPayloadValidator,
  handleValidationErrors,
  validateInspectionPayload,
  updateInspection,
);

router.delete('/:id', requireAuth, requireRole('INSPECTOR', 'SYSTEM_ADMIN'), validateObjectId(), handleValidationErrors, deleteInspection);

router.post('/:id/submit', requireAuth, requireRole('INSPECTOR'), validateObjectId(), handleValidationErrors, submitInspection);
router.post('/:id/return', requireAuth, requireRole('DIRECTOR', 'CEO_REGISTRAR'), validateObjectId(), handleValidationErrors, returnInspection);
router.post('/:id/revert', requireAuth, requireRole('CEO_REGISTRAR'), validateObjectId(), handleValidationErrors, revertInspection);
router.post('/:id/director-approve', requireAuth, requireRole('DIRECTOR'), validateObjectId(), handleValidationErrors, directorApprove);
router.post('/:id/final-approve', requireAuth, requireRole('CEO_REGISTRAR'), validateObjectId(), handleValidationErrors, finalApprove);

module.exports = router;
