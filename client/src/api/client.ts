export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const BACKEND_URL = 'http://localhost:5000/api';

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('rk_jwt_token');

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Format full URL to http://localhost:5000/api without proxy
  let fullUrl: string;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    fullUrl = endpoint;
  } else {
    // Clean path so /api/auth/login or /auth/login resolves to http://localhost:5000/api/auth/login
    let cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (cleanPath.startsWith('/api/')) {
      cleanPath = cleanPath.slice(4); // remove '/api' prefix
    }
    fullUrl = `${BACKEND_URL}${cleanPath}`;
  }

  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Handle unauthorized gracefully
  if (res.status === 401) {
    localStorage.removeItem('rk_jwt_token');
    localStorage.removeItem('rk_user');
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMessage = isJson && data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
      ? (data as { message: string }).message
      : res.statusText || 'API request failed';
    throw new ApiError(errorMessage, res.status, data);
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(url: string, options?: RequestInit) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(url: string, options?: RequestInit) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
};
