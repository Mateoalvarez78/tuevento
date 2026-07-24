// ─── API CLIENT ───────────────────────────────────────────────────────────────
// Centralized HTTP client for all backend communication.
// Handles auth tokens, error normalization, and automatic logout on 401.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Origen del backend (sin el sufijo /api) para servir estáticos como /uploads/...
const ASSET_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

/**
 * Resuelve una ruta de asset del backend (ej. "/uploads/services/x.jpg") a URL
 * absoluta contra el origen del backend. Deja pasar URLs absolutas (http/https).
 */
export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${ASSET_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ── Token management ──────────────────────────────────────────────────────────
export const tokenStorage = {
  get: () => (typeof window !== 'undefined' ? localStorage.getItem('te_token') : null),
  set: (token) => typeof window !== 'undefined' && localStorage.setItem('te_token', token),
  remove: () => typeof window !== 'undefined' && localStorage.removeItem('te_token'),
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
let _onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  _onUnauthorized = fn;
}

async function request(path, options = {}) {
  const token = tokenStorage.get();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const { skipUnauthorizedHandler, ...fetchOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });

  if (res.status === 401) {
    // En endpoints públicos (ej. registro sin sesión) no cerramos sesión ni
    // disparamos el handler global: no hay sesión que expirar.
    if (skipUnauthorizedHandler) {
      let data;
      try { data = await res.json(); } catch { data = {}; }
      throw new ApiError(data.message || 'No autorizado', 401, data.code || 'UNAUTHORIZED');
    }
    tokenStorage.remove();
    if (typeof window !== 'undefined') localStorage.removeItem('te_user');
    if (_onUnauthorized) _onUnauthorized();
    throw new ApiError('Sesión expirada. Por favor iniciá sesión nuevamente.', 401, 'UNAUTHORIZED');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(`Error inesperado del servidor (${res.status})`, res.status);
  }

  if (!res.ok) {
    throw new ApiError(data.message || 'Error del servidor', res.status, data.code, data.reasonCode);
  }

  return data;
}

export class ApiError extends Error {
  constructor(message, status, code, reasonCode) {
    super(message);
    this.status = status;
    this.code = code;
    // Motivo específico de un 409 AVAILABILITY_CONFLICT (blocked,
    // fully_booked, guest_capacity_exceeded, etc. — ver
    // eventonow-back/src/modules/availability/availability.service.js).
    if (reasonCode) this.reasonCode = reasonCode;
    this.name = 'ApiError';
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
export const api = {
  // `options` opcional (ej. { signal } de un AbortController) — para
  // endpoints como /locations/autocomplete, que necesitan poder cancelar una
  // consulta obsoleta mientras el usuario sigue tipeando.
  get: (path, options = {}) => request(path, options),

  post: (path, body, options = {}) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  put: (path, body) =>
    request(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (path) => request(path, { method: 'DELETE' }),

  upload: (path, formData) =>
    request(path, { method: 'POST', body: formData }),
};

// ── Query string builder ──────────────────────────────────────────────────────
export function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) {
      q.set(k, String(v));
    }
  });
  const str = q.toString();
  return str ? `?${str}` : '';
}
