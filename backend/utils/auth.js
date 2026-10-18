const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user) {
  if (!user) return null;

  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  const { passwordHash, ...safe } = obj;
  return safe;
}

module.exports = { signToken, generateCsrfToken, sanitizeUser };