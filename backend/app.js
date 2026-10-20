const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { csrfProtection, attachCsrfToken } = require('./middleware/csrf');
const authRoutes = require('./routes/authRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const inspectionFormRoutes = require('./routes/inspectionFormRoutes');
const regionRoutes = require('./routes/regionRoutes');
const outletRoutes = require('./routes/outletRoutes');
const userRoutes = require('./routes/userRoutes');
const emailLogRoutes = require('./routes/emailLogRoutes');
const geocodingRoutes = require('./routes/geocodingRoutes');

dotenv.config();

const app = express();

// Render (and most PaaS providers) terminate TLS at a reverse proxy and forward
// the real client IP in X-Forwarded-For. Without this, express-rate-limit keys
// every request by the proxy's shared IP, so the entire user base shares one
// bucket and the API returns "Too many requests" for everyone at once.
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.warn('FRONTEND_URL is not set. All browser requests to this API will be rejected by CORS.');
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for this origin.'));
      }
    },
    credentials: true,
    // The CSRF token is delivered in this header so the browser client can
    // keep its copy in sync with the server's double-submit cookie.
    exposedHeaders: ['X-CSRF-Token'],
  }),
);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Cache-Control headers for read-only GET endpoints. Session-scoped and
// user-specific payloads are never cached, otherwise a client could keep
// reading a stale identity after logout or a role change.
const NO_CACHE_PREFIXES = ['/api/auth', '/api/users', '/api/email-logs'];
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    const isUserScoped = NO_CACHE_PREFIXES.some(
      (prefix) => req.path === prefix || req.path.startsWith(prefix + '/'),
    );
    if (!isUserScoped) {
      res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');
    } else {
      res.set('Cache-Control', 'no-store');
    }
  }
  next();
});

// Request timeout middleware (prevents hanging connections)
app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ success: false, message: 'Request timeout.' });
    }
  }, 30000);
  res.on('finish', () => clearTimeout(timeout));
  next();
});

// Attach CSRF token cookie on every response (if not already present)
app.use(attachCsrfToken);

// Apply CSRF protection to state-changing requests
app.use(csrfProtection);

// Rate limits are generous by default so a busy office, a demo, or a shared
// NAT never locks legitimate users out. They can be tightened with env vars
// without a code change.
const AUTH_RATE_LIMIT = parseInt(process.env.RATE_LIMIT_AUTH, 10) || (process.env.NODE_ENV === 'production' ? 100 : 1000);
const API_RATE_LIMIT = parseInt(process.env.RATE_LIMIT_API, 10) || (process.env.NODE_ENV === 'production' ? 1000 : 10000);
const EXPORT_RATE_LIMIT = parseInt(process.env.RATE_LIMIT_EXPORT, 10) || 30;

const rateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait a moment and try again.' },
};

const authLimiter = rateLimit({
  ...rateLimitOptions,
  max: AUTH_RATE_LIMIT,
  // Only failed attempts count towards the limit. A legitimate user signing in
  // repeatedly (or a shared IP) must never be throttled out of the portal.
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  ...rateLimitOptions,
  max: API_RATE_LIMIT,
});

// Stricter rate limit for export endpoints (CPU-intensive)
const exportLimiter = rateLimit({
  ...rateLimitOptions,
  max: EXPORT_RATE_LIMIT,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/inspections', apiLimiter, inspectionRoutes);
app.use('/api/inspection-form', apiLimiter, inspectionFormRoutes);
app.use('/api/regions', apiLimiter, regionRoutes);
app.use('/api/outlets', apiLimiter, outletRoutes);
app.use('/api/geocoding', apiLimiter, geocodingRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/email-logs', apiLimiter, emailLogRoutes);

// CSRF token endpoint (exempt from CSRF protection)
const { exposeCsrfToken } = require('./middleware/csrf');
app.get('/api/csrf-token', exposeCsrfToken);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', message: 'KVB inspection portal backend is running.' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
