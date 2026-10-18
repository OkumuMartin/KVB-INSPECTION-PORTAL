const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { EmailLog } = require('../models');
const { retryEmail } = require('../services/emailService');
const { createAuditLog } = require('../services/auditLogService');

const router = express.Router();

router.get('/', requireAuth, requireRole('SYSTEM_ADMIN'), async (req, res, next) => {
  try {
    const { status, emailType } = req.query;
    const parsedPage = parseInt(req.query.page, 10);
    const parsedLimit = parseInt(req.query.limit, 10);
    const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Math.min(Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50, 200);
    const filter = {};
    if (status) filter.status = status;
    if (emailType) filter.emailType = emailType;

    const logs = await EmailLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await EmailLog.countDocuments(filter);

    return res.json({ items: logs, total, page, limit });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/retry', requireAuth, requireRole('SYSTEM_ADMIN'), async (req, res, next) => {
  try {
    const result = await retryEmail(req.params.id, req.user);
    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'EMAIL_SENT',
      metadata: { retry: true, emailLogId: req.params.id },
    });
    return res.json({ message: 'Email retry attempted.', ...result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
