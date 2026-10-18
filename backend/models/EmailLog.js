const mongoose = require('mongoose');

const EMAIL_STATUSES = ['PENDING', 'SENT', 'FAILED', 'RETRYING'];

const emailLogSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true, trim: true },
    emailType: { type: String, required: true, trim: true },
    inspection: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection', index: true },
    status: { type: String, required: true, enum: EMAIL_STATUSES, default: 'PENDING' },
    error: { type: String },
    sentAt: { type: Date },
    attempts: { type: Number, default: 0 },
    template: { type: String },
  },
  { timestamps: true },
);

emailLogSchema.index({ status: 1 });
emailLogSchema.index({ emailType: 1 });
emailLogSchema.index({ sentAt: -1 });
emailLogSchema.index({ createdAt: -1 });

module.exports = { schema: emailLogSchema, EMAIL_STATUSES };
