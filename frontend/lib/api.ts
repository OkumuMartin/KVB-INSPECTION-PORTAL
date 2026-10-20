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

/**
 * Resolve the absolute backend origin (no trailing /api).
 *
 * `window.open` navigations cannot carry the module-scoped CSRF token, so
 * the export endpoints rely entirely on the browser attaching the httpOnly
 * JWT cookie. A relative URL resolves against the frontend origin (Next.js
 * in production), the cookie is never sent, and the download 401s. An
 * absolute backend URL makes the cookie travel to Express.
 */
export function getBackendOrigin() {
  if (rawBaseUrl.startsWith('http')) {
    return rawBaseUrl.replace(/\/api$/, '').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

/** Build an absolute backend URL for a path that starts with /api. */
export function backendUrl(path: string) {
  const origin = getBackendOrigin();
  if (!origin) return path;
  return `${origin}${path}`;
}

// The CSRF token lives in a cookie set by attachCsrfToken on every backend
// response. Because the frontend and backend are cross-site (Vercel vs
// Render), document.cookie on the frontend page never reflects the
// backend's csrfToken cookie. Instead we capture the token from the
// X-CSRF-Token response header and hold it in this module-level variable so
// the request interceptor can echo it back in the x-csrf-token header.
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

// Routes that a signed-out visitor is allowed to reach. The session probe
// answers 401 for every guest, so redirecting on it would bounce visitors off
// the public landing page before they ever saw it.
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/unauthorized'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

// Response interceptor: keep the CSRF token in sync with the server.
// The backend echoes the authoritative token in the X-CSRF-Token header on
// every response. Reading it here guarantees the value we echo back in the
// request header always matches the server's double-submit cookie, even when
// the cookie is rotated or dropped by the browser.
api.interceptors.response.use(
  (response) => {
    const headerToken = response.headers?.['x-csrf-token'];
    if (typeof headerToken === 'string' && headerToken) {
      csrfToken = headerToken;
    } else if (response.data && typeof response.data.csrfToken === 'string') {
      csrfToken = response.data.csrfToken;
    }
    return response;
  },
  async (error) => {
    const original = error.config as (typeof error.config & { _csrfRetried?: boolean }) | undefined;
    const status = error.response?.status;
    const message = String(error.response?.data?.message || '');

    // A stale or rotated CSRF token produces a 403. Fetch a fresh token and
    // replay the request once so the user never sees a spurious failure.
    const isStateChanging = ['post', 'put', 'patch', 'delete'].includes(
      String(original?.method || 'get').toLowerCase(),
    );
    if (
      status === 403 &&
      isStateChanging &&
      original &&
      !original._csrfRetried &&
      /csrf/i.test(message)
    ) {
      original._csrfRetried = true;
      try {
        const res = await api.get('/csrf-token');
        const token = res.headers?.['x-csrf-token'] || res.data?.csrfToken;
        if (typeof token === 'string' && token) {
          csrfToken = token;
          original.headers = { ...(original.headers || {}), 'x-csrf-token': token };
          return api(original);
        }
      } catch {
        // Fall through to the original error.
      }
    }

    // On 401, send the user to the sign-in page. This only applies to
    // protected pages: on a public page a 401 simply means "not signed in",
    // and redirecting there would hide the landing page from every guest.
    if (status === 401 && typeof window !== 'undefined' && !isPublicRoute(window.location.pathname)) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
