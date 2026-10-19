const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { outletValidator, validateObjectId, handleValidationErrors } = require('../validators/outletValidators');
const outletController = require('../controllers/outletController');

const router = express.Router();
// Per AGENTS.md: outlet records are reference data. Only SYSTEM_ADMIN and
// DIRECTOR may create or update them; inspectors can read.
const canManageOutlets = requireRole('SYSTEM_ADMIN', 'DIRECTOR', 'INSPECTOR');

router.get('/', requireAuth, outletController.listOutlets);
router.post('/', requireAuth, canManageOutlets, outletValidator, handleValidationErrors, outletController.createOutlet);
router.get('/:id', requireAuth, validateObjectId(), handleValidationErrors, outletController.getOutlet);
router.put('/:id', requireAuth, canManageOutlets, validateObjectId(), outletValidator, handleValidationErrors, outletController.updateOutlet);
router.delete('/:id', requireAuth, canManageOutlets, validateObjectId(), handleValidationErrors, outletController.deleteOutlet);

module.exports = router;
