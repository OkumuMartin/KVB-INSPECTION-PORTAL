const { AuditLog } = require('../models');

function resolveRequestMeta(req) {
  if (!req) return { ipAddress: undefined, userAgent: undefined };
  const forwarded = req.headers ? req.headers['x-forwarded-for'] : undefined;
  const forwardedIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined;
  return {
    ipAddress: forwardedIp || req.ip || undefined,
    userAgent: req.headers ? req.headers['user-agent'] : undefined,
  };
}

async function createAuditLog(params) {
  const meta = params.req ? resolveRequestMeta(params.req) : {};
  const { ipAddress, userAgent } = meta;
  try {
    await AuditLog.create({
      user: params.user,
      role: params.role,
      action: params.action,
      inspection: params.inspection,
      outlet: params.outlet,
      metadata: params.metadata || {},
      changes: params.changes,
      ipAddress: params.ipAddress || ipAddress || meta.ipAddress,
      userAgent: params.userAgent || userAgent || meta.userAgent,
    });
  } catch (error) {
    // CRITICAL: Audit log failures must be surfaced, not silently swallowed.
    // Security-relevant events (login failures, privilege escalations, state
    // changes) that fail to be recorded must produce a visible alert so that
    // operators can detect audit-trail gaps rather than assume everything was logged.
    console.error('CRITICAL: Audit log creation failed for action:', params.action, '—', error.message);
    // In production, re-throw so the caller's error handler surfaces the failure.
    // In development/test, still fail-open to avoid blocking the primary flow.
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    // Non-production: fail-open but log prominently.
    if (process.env.AUDIT_FAIL_OPEN === 'false') {
      throw error;
    }
  }
}

async function listInspectionAuditLogs(inspectionId, { page = 1, limit = 50 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLog.find({ inspection: inspectionId })
      .select('-userAgent')
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments({ inspection: inspectionId }),
  ]);

  return { items, total, page, limit };
}

module.exports = { createAuditLog, listInspectionAuditLogs, resolveRequestMeta };