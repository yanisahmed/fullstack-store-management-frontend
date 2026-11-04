import { translate, translateError } from './i18n';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public params?: Record<string, any>) { super(message); }
}

const isBrowser = typeof window !== 'undefined';
export const tokens = {
  get access() { return isBrowser ? localStorage.getItem('access') : null; },
  get refresh() { return isBrowser ? localStorage.getItem('refresh') : null; },
  set(a: string, r: string) { localStorage.setItem('access', a); localStorage.setItem('refresh', r); },
  clear() { localStorage.removeItem('access'); localStorage.removeItem('refresh'); },
};

async function refreshTokens() {
  if (!tokens.refresh) return false;
  const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: tokens.refresh }) });
  if (!res.ok) return false;
  const d = await res.json();
  tokens.set(d.accessToken, d.refreshToken);
  return true;
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}, retried = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 && !retried && (await refreshTokens())) return api<T>(path, opts, true);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fields = data.errors ? Object.entries(data.errors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ') : '';
    throw new ApiError(res.status, translateError(data.code, data.params, fields || data.message || translate('err.generic')), data.code, data.params);
  }
  return data as T;
}

/** Picture URL for a stored photo token (the API serves these publicly with long caching). */
export const imageUrl = (token?: string | null) => (token ? `${BASE}/images/${token}` : null);

/** Uploads already-shrunk image bytes. Returns the token to save on the product/customer. */
export async function uploadImage(kind: 'product' | 'customer', blob: Blob, retried = false): Promise<{ token: string }> {
  const res = await fetch(`${BASE}/images/${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'image/jpeg', ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}) },
    body: blob,
  });
  if (res.status === 401 && !retried && (await refreshTokens())) return uploadImage(kind, blob, true);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, translateError(data.code, data.params, data.message || translate('err.generic')), data.code, data.params);
  return data;
}
