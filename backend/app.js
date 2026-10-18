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

// Cache-Control headers for read-only GET endpoints
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 25 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

// Stricter rate limit for export endpoints (CPU-intensive)
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Export rate limit exceeded. Please try again later.' },
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
