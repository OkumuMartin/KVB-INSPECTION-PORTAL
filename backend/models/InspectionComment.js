const mongoose = require('mongoose');

const inspectionCommentSchema = new mongoose.Schema(
  {
    inspection: { type: mongoose.Schema.Types.ObjectId, ref: 'Inspection', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    commentText: { type: String, required: [true, 'Comment text is required.'], trim: true, maxlength: [2000, 'Comment must not exceed 2000 characters.'] },
    isInternal: { type: Boolean, default: false },
  },
  { timestamps: true },
);

inspectionCommentSchema.index({ inspection: 1, createdAt: 1 });

module.exports = { schema: inspectionCommentSchema };
