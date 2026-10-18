const bcrypt = require('bcryptjs');
const { User, AuditLog } = require('../models');
const { createAuditLog } = require('../services/auditLogService');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
const MAX_PAGE_SIZE = 200;

function toPositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

async function listUsers(req, res, next) {
  try {
    const { role, status } = req.query;
    const currentPage = toPositiveInt(req.query.page, 1);
    const pageSize = Math.min(toPositiveInt(req.query.limit, 50), MAX_PAGE_SIZE);
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip((currentPage - 1) * pageSize)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({ items: users, total, page: currentPage, limit: pageSize });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, username, password, role, status } = req.body || {};

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      name,
      email,
      username,
      passwordHash,
      role,
      status: status || 'ACTIVE',
    });

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'USER_CREATED',
      metadata: { createdUser: user._id, role: user.role },
    });

    return res.status(201).json({ item: user });
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ item: user });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { name, email, username, role, status, password } = req.body || {};
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (username) updates.username = username;
    if (role) updates.role = role;
    if (status) updates.status = status;

    if (password) {
      updates.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-passwordHash').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'USER_UPDATED',
      metadata: { updatedUser: user._id, changes: Object.keys(updates) },
    });

    return res.json({ item: user });
  } catch (error) {
    next(error);
  }
}

async function changeStatus(req, res, next) {
  try {
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true },
    ).select('-passwordHash').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'USER_STATUS_CHANGED',
      metadata: { targetUser: user._id, newStatus: status },
    });

    return res.json({ item: user });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({ message: 'Cannot reset your own password via admin endpoint.' });
    }

    const { password } = req.body;

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { passwordHash },
      { returnDocument: 'after', runValidators: true, select: '-passwordHash' },
    ).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await createAuditLog({
      user: req.user._id,
      role: req.user.role,
      action: 'PASSWORD_RESET',
      metadata: { targetUser: user._id },
    });

    return res.json({ message: 'Password has been reset.' });
  } catch (error) {
    next(error);
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const { action, inspection, user: userId } = req.query;
    const currentPage = toPositiveInt(req.query.page, 1);
    const pageSize = Math.min(toPositiveInt(req.query.limit, 50), MAX_PAGE_SIZE);
    const filter = {};
    if (action) filter.action = action;
    if (inspection) filter.inspection = inspection;
    if (userId) filter.user = userId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip((currentPage - 1) * pageSize)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({ items: logs, total, page: currentPage, limit: pageSize });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  getUser,
  updateUser,
  changeStatus,
  resetPassword,
  listAuditLogs,
};
