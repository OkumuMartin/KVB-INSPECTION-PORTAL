const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { signToken, sanitizeUser } = require('../utils/auth');
const { createAuditLog } = require('../services/auditLogService');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (typeof username !== 'string' || !username || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ email: username.toLowerCase() }, { username }],
    });

    if (!user) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        req,
        metadata: { username, reason: 'user_not_found' },
      });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      await createAuditLog({
        user: user._id,
        role: user.role,
        action: 'LOGIN_FAILED',
        req,
        metadata: { reason: 'bad_password' },
      });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.status !== 'ACTIVE') {
      await createAuditLog({
        user: user._id,
        role: user.role,
        action: 'LOGIN_FAILED',
        req,
        metadata: { reason: 'inactive_user' },
      });
      return res.status(403).json({ message: 'This account is inactive. Please contact the system administrator.' });
    }

    const token = signToken({ id: user._id.toString(), role: user.role });

    // The CSRF token is issued uniformly by the attachCsrfToken middleware
    // (registered before routes). Returning res.locals.csrfToken keeps the
    // cookie value and the body value identical; setting a second cookie here
    // would overwrite the cookie with a different token and break every
    // state-changing request after login.
    const csrfToken = res.locals.csrfToken;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      partitioned: process.env.NODE_ENV === 'production',
    });

    await createAuditLog({
      user: user._id,
      role: user.role,
      action: 'LOGIN',
      req,
    });

    return res.json({
      message: 'Login successful.',
      user: sanitizeUser(user),
      csrfToken,
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user) {
      await createAuditLog({
        user: req.user._id,
        role: req.user.role,
        action: 'LOGOUT',
        req,
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    return res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
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

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
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

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, logout, me, register };
