const express = require('express');
const { loginValidator, handleValidationErrors } = require('../validators/authValidators');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginValidator, handleValidationErrors, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
