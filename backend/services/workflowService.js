const { VALID_TRANSITIONS } = require('../models');
const { Inspection } = require('../models');
const { createAuditLog } = require('./auditLogService');

// Maps a target status to the canonical AuditLog action enum value.
// transitionStatus must never emit a raw `STATUS_CHANGED_TO_*` string
// because AuditLog.action is constrained to AUDIT_ACTIONS.
const STATUS_AUDIT_ACTION = {
  SUBMITTED: 'INSPECTION_SUBMITTED',
  PENDING_DIRECTOR_REVIEW: 'INSPECTION_SUBMITTED',
  DIRECTOR_APPROVED: 'DIRECTOR_APPROVED',
  PENDING_CEO_REVIEW: 'DIRECTOR_APPROVED',
  RETURNED_TO_INSPECTOR: 'INSPECTION_RETURNED',
  FINAL_APPROVED: 'CEO_FINAL_APPROVED',
};

const ROLE_APPROVAL_STEPS = {
  DIRECTOR: {
    from: 'PENDING_DIRECTOR_REVIEW',
    to: 'DIRECTOR_APPROVED',
    next: 'PENDING_CEO_REVIEW',
  },
  CEO_REGISTRAR: {
    from: ['DIRECTOR_APPROVED', 'PENDING_CEO_REVIEW'],
    to: 'FINAL_APPROVED',
    next: null,
  },
};

function validateTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return false;
  }
  return true;
}

function getApprovalStep(role) {
  if (role === 'DIRECTOR') return ROLE_APPROVAL_STEPS.DIRECTOR;
  if (role === 'CEO_REGISTRAR') return ROLE_APPROVAL_STEPS.CEO_REGISTRAR;
  return null;
}

async function canInspectBeEdited(inspection) {
  if (!inspection) return false;
  if (inspection.isLocked) return false;
  if (inspection.status === 'FINAL_APPROVED') return false;
  return true;
}

/**
 * Centralized state transition function.
 * All status changes must go through this function to ensure
 * the state machine is consistent and audit-tracked.
 *
 * @param {string} inspectionId - The inspection to transition
 * @param {string} nextStatus - The target status
 * @param {object} actor - The user performing the transition
 * @param {string} reason - Optional reason (for RETURNED_TO_INSPECTOR)
 * @param {object} metadata - Additional metadata for audit log
 * @returns {object} The updated inspection document
 */
async function transitionStatus(inspectionId, nextStatus, actor, reason = null, metadata = {}) {
  const inspection = await Inspection.findById(inspectionId);
  if (!inspection) {
    const error = new Error('Inspection not found.');
    error.status = 404;
    throw error;
  }

  const currentStatus = inspection.status;

  if (!validateTransition(currentStatus, nextStatus)) {
    const error = new Error(
      `Invalid status transition from ${currentStatus} to ${nextStatus}.`,
    );
    error.status = 409;
    throw error;
  }

  // Extract request metadata safely BEFORE sanitizing — req may contain circular refs.
  const ipAddress = metadata.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    || metadata.req?.ip
    || undefined;
  const userAgent = metadata.req?.headers?.['user-agent'] || undefined;

  // Sanitize metadata: keep only JSON-safe primitives. Strip req/res/Mongoose docs/functions
  // that contain circular references which BSON cannot serialize.
  const safeMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      safeMetadata[key] = value;
    }
  }

  // Apply the transition
  inspection.status = nextStatus;

  // Lock final approved inspections
  if (nextStatus === 'FINAL_APPROVED') {
    inspection.isLocked = true;
    inspection.draft = false;
  }

  // Record in workflow history — metadata contains only safe primitives, no circular refs.
  inspection.workflowHistory = inspection.workflowHistory || [];
  inspection.workflowHistory.push({
    action: STATUS_AUDIT_ACTION[nextStatus] || `STATUS_CHANGED_TO_${nextStatus}`,
    actor: actor._id,
    role: actor.role,
    reason: reason || undefined,
    timestamp: new Date(),
    metadata: { from: currentStatus, to: nextStatus, ...safeMetadata },
  });

  try {
    await inspection.save();
  } catch (saveError) {
    const error = new Error(`Failed to persist inspection status change: ${saveError.message}`);
    error.statusCode = 500;
    throw error;
  }
  // Audit log — the state change has already been committed to the database,
  // so we must not roll it back. However, in production a failed audit log is a
  // security incident: surface it loudly rather than silently discarding it.
  const auditAction = STATUS_AUDIT_ACTION[nextStatus] || `STATUS_CHANGED_TO_${nextStatus}`;
  try {
    await createAuditLog({
      ipAddress,
      userAgent,
      user: actor._id,
      role: actor.role,
      action: auditAction,
      inspection: inspection._id,
      metadata: { from: currentStatus, to: nextStatus, reason, ...safeMetadata },
    });
  } catch (auditError) {
    // Audit failure after a committed state change. Never roll back the
    // inspection, but ensure operators can detect the gap.
    console.error('CRITICAL: Audit log creation failed during transition to', nextStatus, '—', auditError.message);
    if (process.env.NODE_ENV === 'production') {
      // Surface the failure to the caller so the API returns a non-2xx response
      // and the operator knows the audit trail has a gap for this transition.
      const auditGapError = new Error(
        `State transition to ${nextStatus} succeeded but audit logging failed. ` +
        `Please verify the audit trail for inspection ${inspection._id}.`,
      );
      auditGapError.statusCode = 500;
      throw auditGapError;
    }
  }

  return inspection;
}

module.exports = {
  validateTransition,
  getApprovalStep,
  canInspectBeEdited,
  ROLE_APPROVAL_STEPS,
  transitionStatus,
};