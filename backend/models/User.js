const mongoose = require('mongoose');

const ROLES = ['INSPECTOR', 'DIRECTOR', 'CEO_REGISTRAR', 'SYSTEM_ADMIN'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required.'], trim: true, maxlength: [100, 'Name must not exceed 100 characters.'] },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.'],
    },
    username: { type: String, required: true, unique: true, trim: true, maxlength: [50, 'Username must not exceed 50 characters.'] },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ROLES, default: 'INSPECTOR' },
    status: { type: String, required: true, enum: STATUSES, default: 'ACTIVE' },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true },
    // Hashed password-reset token. Only ever stored as a SHA-256 digest so a
    // database leak cannot be used to reset a user's password.
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

userSchema.index({ role: 1 });

module.exports = { schema: userSchema, ROLES, STATUSES };
