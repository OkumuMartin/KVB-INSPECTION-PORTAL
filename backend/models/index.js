const mongoose = require('mongoose');
const { schema: userSchema, ROLES, STATUSES } = require('./User');
const { schema: outletSchema, OUTLET_TYPES } = require('./Outlet');
const { schema: inspectionSchema, WORKFLOW_STATES, VALID_TRANSITIONS } = require('./Inspection');
const { schema: inspectionCommentSchema } = require('./InspectionComment');
const { schema: auditLogSchema, AUDIT_ACTIONS } = require('./AuditLog');
const { schema: emailLogSchema, EMAIL_STATUSES } = require('./EmailLog');
const { schema: counterSchema } = require('./Counter');

const models = {
  User: mongoose.model('User', userSchema),
  Outlet: mongoose.model('Outlet', outletSchema),
  Inspection: mongoose.model('Inspection', inspectionSchema),
  InspectionComment: mongoose.model('InspectionComment', inspectionCommentSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  EmailLog: mongoose.model('EmailLog', emailLogSchema),
  Counter: mongoose.model('Counter', counterSchema),
  ROLES,
  STATUSES,
  OUTLET_TYPES,
  WORKFLOW_STATES,
  VALID_TRANSITIONS,
  AUDIT_ACTIONS,
  EMAIL_STATUSES,
};

module.exports = models;
