export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Held in memory only (never localStorage) to reduce XSS token-theft surface.
// auth-context.tsx keeps this in sync with its own React state.
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

// Refresh is triggered by an external callback so api-client stays framework-agnostic;
// auth-context.tsx wires this to its own refresh() on mount.
let refreshFn: (() => Promise<string | null>) | null = null;
export function setRefreshHandler(fn: () => Promise<string | null>) {
  refreshFn = fn;
}

// Set by TenantProvider (see components/providers/tenant-provider.tsx) from
// the current /c/[slug] route param. Null on pages outside that segment
// (the marketing page, /login, /register) — those never call tenant-scoped
// endpoints, so no header is sent.
let tenantSlug: string | null = null;
export function setTenantSlug(slug: string | null) {
  tenantSlug = slug;
}
export function getTenantSlug() {
  return tenantSlug;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuthRetry?: boolean;
}

async function rawRequest(path: string, options: RequestOptions = {}) {
  // `skipAuthRetry` is read by apiFetch, not here — left in `rest` where fetch
  // silently ignores it as an unrecognized RequestInit field.
  const { body, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return res;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, options);

  // Access token expired mid-session — try one silent refresh, then retry once.
  if (res.status === 401 && !options.skipAuthRetry && refreshFn) {
    const newToken = await refreshFn();
    if (newToken) {
      res = await rawRequest(path, { ...options, skipAuthRetry: true });
    }
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(data?.error || "Something went wrong", res.status, data?.details);
  }

  return data as T;
}

// For non-JSON responses (e.g. the .ics calendar download) that apiFetch can't parse.
export async function apiFetchBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  let res = await rawRequest(path, options);

  if (res.status === 401 && !options.skipAuthRetry && refreshFn) {
    const newToken = await refreshFn();
    if (newToken) {
      res = await rawRequest(path, { ...options, skipAuthRetry: true });
    }
  }

  if (!res.ok) {
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json() : undefined;
    throw new ApiError(data?.error || "Something went wrong", res.status, data?.details);
  }

  return res.blob();
}
