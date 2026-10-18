const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createUserValidator,
  updateUserValidator,
  statusValidator,
  handleValidationErrors,
} = require('../validators/userValidators');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', requireAuth, requireRole('SYSTEM_ADMIN'), userController.listUsers);
router.post('/', requireAuth, requireRole('SYSTEM_ADMIN'), createUserValidator, handleValidationErrors, userController.createUser);
router.get('/audit-logs', requireAuth, requireRole('SYSTEM_ADMIN'), userController.listAuditLogs);

router.get('/:id', requireAuth, requireRole('SYSTEM_ADMIN'), handleValidationErrors, userController.getUser);
router.put('/:id', requireAuth, requireRole('SYSTEM_ADMIN'), updateUserValidator, handleValidationErrors, userController.updateUser);
router.patch('/:id/status', requireAuth, requireRole('SYSTEM_ADMIN'), statusValidator, handleValidationErrors, userController.changeStatus);
router.post('/:id/reset-password', requireAuth, requireRole('SYSTEM_ADMIN'), handleValidationErrors, userController.resetPassword);

module.exports = router;
