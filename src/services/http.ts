import { API_URL } from '../config/env';

export class HttpError extends Error {
  constructor(readonly status: number, readonly body: unknown, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  authenticated?: boolean;
};

let getToken: () => string | null = () => null;
let onUnauthorized: (token: string) => Promise<void> = async () => {};

export function configureHttpAuth(
  tokenProvider: () => string | null,
  unauthorizedHandler: (token: string) => Promise<void>,
) {
  getToken = tokenProvider;
  onUnauthorized = unauthorizedHandler;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, authenticated = true, signal, ...rest } = options;
  const token = authenticated ? getToken() : null;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 15000);

  try {
    const response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...rest,
      signal: controller.signal,
      headers: requestHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let payload: unknown = null;
    try { payload = text ? JSON.parse(text) : null; } catch { /* Do not display HTML error pages. */ }

    if (!response.ok) {
      if (response.status === 401 && token) await onUnauthorized(token);
      const message = payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : 'Não foi possível concluir a solicitação. Tente novamente.';
      throw new HttpError(response.status, payload, response.status >= 500
        ? 'O servidor está indisponível. Tente novamente em instantes.' : message);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new Error('Não foi possível conectar à API. Verifique sua conexão e tente novamente.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
export { API_URL };
