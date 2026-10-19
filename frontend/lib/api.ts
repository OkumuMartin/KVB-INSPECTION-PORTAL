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

// The CSRF token lives in a cookie set by attachCsrfToken on every backend
// response. Because the frontend and backend are cross-site (Vercel vs
// Render), document.cookie on the frontend page never reflects the
// backend's csrfToken cookie. Instead we capture the token from the JSON
// body of GET /csrf-token and hold it in this module-level variable so the
// request interceptor can echo it back in the x-csrf-token header.
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

// Request interceptor: attach CSRF token to state-changing requests
api.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const token = csrfToken;
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
  (response) => {
    // Some endpoints may echo the CSRF token back in the body; refresh our
    // copy so subsequent state-changing requests stay in sync.
    if (response.data && typeof response.data.csrfToken === 'string') {
      csrfToken = response.data.csrfToken;
    }
    return response;
  },
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
