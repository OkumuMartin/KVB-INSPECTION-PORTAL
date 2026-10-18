const mongoose = require('mongoose');

const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'INSPECTION_CREATED',
  'INSPECTION_UPDATED',
  'INSPECTION_DELETED',
  'INSPECTION_AMENDED',
  'DRAFT_SAVED',
  'INSPECTION_SUBMITTED',
  'INSPECTION_RETURNED',
  'INSPECTION_RESUBMITTED',
  'DIRECTOR_APPROVED',
  'CEO_FINAL_APPROVED',
  'COMMENT_ADDED',
  'SIGNATURE_CAPTURED',
  'PDF_GENERATED',
  'EMAIL_SENT',
  'EMAIL_FAILED',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_STATUS_CHANGED',
  'PASSWORD_RESET',
  'OUTLET_CREATED',
  'OUTLET_UPDATED',
];

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    action: { type: String, required: true, enum: AUDIT_ACTIONS },
    inspection: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection', index: true },
    outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
    metadata: { type: mongoose.Schema.Types.Mixed },
    changes: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, strict: true },
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ inspection: 1, action: 1 });
auditLogSchema.index({ inspection: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = { schema: auditLogSchema, AUDIT_ACTIONS };
