import axios from 'axios';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
// Normalize so baseURL always ends with /api — local dev uses
// http://localhost:5000/api, production may omit the trailing /api.
const baseURL = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The CSRF token lives in an httpOnly cookie set by attachCsrfToken on every
// response. Reading it from the cookie (not a body field) guarantees the
// header token always matches the cookie token — otherwise state-changing
// requests fail with 403 "CSRF token mismatch".
function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Request interceptor: attach CSRF token to state-changing requests
api.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const token = readCsrfCookie();
      if (token) {
        config.headers['x-csrf-token'] = token;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: capture new CSRF tokens from auth responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // On 401, redirect to login
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;