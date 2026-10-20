const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const { signToken, sanitizeUser } = require('../utils/auth');
const { createAuditLog } = require('../services/auditLogService');
const { sendEmail, buildPasswordResetEmail } = require('../services/emailService');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
const RESET_TOKEN_TTL_MINUTES = parseInt(process.env.PASSWORD_RESET_TTL_MINUTES, 10) || 60;

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

// Public self-registration. New accounts are always created as INSPECTOR and
// ACTIVE; a system administrator can later change the role or deactivate the
// account. Elevating roles here would be a privilege-escalation hole.
async function publicRegister(req, res, next) {
  try {
    const { name, email, username, password } = req.body || {};

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const normalizedUsername = String(username || '').trim();

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    if (await User.findOne({ username: normalizedUsername })) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      name: String(name || '').trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      role: 'INSPECTOR',
      status: 'ACTIVE',
    });

    await createAuditLog({
      user: user._id,
      role: 'INSPECTOR',
      action: 'USER_CREATED',
      req,
      metadata: { createdUser: user._id, role: 'INSPECTOR', selfRegistered: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now sign in to the portal.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'An account with that email or username already exists.' });
    }
    next(error);
  }
}

// Issues a one-time password-reset link. The response is deliberately
// identical whether or not the email exists, so the endpoint cannot be used to
// enumerate registered accounts.
async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const genericMessage =
      'If an account exists for that email address, a password reset link has been sent.';

    const user = await User.findOne({ email });

    if (!user || user.status !== 'ACTIVE') {
      await createAuditLog({
        action: 'PASSWORD_RESET',
        req,
        metadata: { email, outcome: 'no_active_account' },
      }).catch(() => {});
      return res.json({ success: true, message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    user.passwordResetToken = hashResetToken(rawToken);
    user.passwordResetExpires = expiresAt;
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${String(baseUrl).replace(/\/$/, '')}/reset-password?token=${rawToken}`;

    const { html, text } = buildPasswordResetEmail({
      name: user.name,
      resetUrl,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    });

    try {
      await sendEmail({
        to: user.email,
        emailType: 'PASSWORD_RESET',
        subject: 'KVB Inspection Portal - Reset your password',
        html,
        text,
      });
    } catch (emailError) {
      console.error('Password reset email failed:', emailError.message);
    }

    await createAuditLog({
      user: user._id,
      role: user.role,
      action: 'PASSWORD_RESET',
      req,
      metadata: { email: user.email, outcome: 'link_sent' },
    }).catch(() => {});

    const response = { success: true, message: genericMessage };

    // The reset link is only echoed back when explicitly opted in, so a
    // misconfigured production deployment can never leak a live reset URL.
    if (process.env.EXPOSE_RESET_LINK === 'true') {
      response.devResetUrl = resetUrl;
    }

    return res.json(response);
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    const user = await User.findOne({
      passwordResetToken: hashResetToken(String(token)),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await createAuditLog({
      user: user._id,
      role: user.role,
      action: 'PASSWORD_RESET',
      req,
      metadata: { email: user.email, outcome: 'password_updated' },
    }).catch(() => {});

    return res.json({ success: true, message: 'Your password has been updated. You can now sign in.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, logout, me, register, publicRegister, forgotPassword, resetPassword };
