const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Request failed.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiGet(path, options = {}) {
  return apiRequest(path, { method: 'GET', ...options });
}

export async function apiPost(path, body, options = {}) {
  return apiRequest(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

export async function apiPut(path, body, options = {}) {
  return apiRequest(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

export async function apiDelete(path, options = {}) {
  return apiRequest(path, { method: 'DELETE', ...options });
}

export default apiRequest;
