const express = require('express');
const {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  handleValidationErrors,
} = require('../validators/authValidators');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginValidator, handleValidationErrors, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

// Public account recovery. These are CSRF-exempt (see middleware/csrf.js) so
// a user can recover access even with a broken session.
router.post('/forgot-password', forgotPasswordValidator, handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, handleValidationErrors, authController.resetPassword);

// Public self-registration. Always creates an INSPECTOR account; only
// SYSTEM_ADMIN may create users with elevated roles.
router.post('/register', registerValidator, handleValidationErrors, authController.publicRegister);

module.exports = router;
