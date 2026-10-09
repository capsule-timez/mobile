/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
test('auth requests use the backend contract and protected requests carry the token', async (t) => {
  const { authApi } = await import('../src/services/auth');
  const { http, configureHttpAuth } = await import('../src/services/http');
  const requests: Array<{ url: string; options: RequestInit }> = [];
  let rejected = '';
  let status = 200;
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    requests.push({ url, options });
    return new Response(JSON.stringify(status === 401 ? { message: 'Sessão expirada' } :
      url.endsWith('/me') ? { id: 'user-1', name: 'User', email: 'user@example.com', createdAt: '2026-10-09T12:00:00.000Z' } : { token: 'test-token', user: { id: 'user-1' } }), { status });
  });
  await authApi.login({ email: 'user@example.com', password: 'password123' });
  assert.equal(requests[0].url, 'http://localhost:3000/api/auth/login');
  assert.deepEqual(JSON.parse(requests[0].options.body as string), { email: 'user@example.com', password: 'password123' });
  assert.equal(new Headers(requests[0].options.headers).has('Authorization'), false);
  await authApi.register({ name: 'User', email: 'user@example.com', password: 'password123' });
  assert.equal(requests[1].url, 'http://localhost:3000/api/auth/register');
  assert.equal(JSON.parse(requests[1].options.body as string).name, 'User');
  assert.deepEqual(await authApi.me('saved-token'), { userId: 'user-1' });
  assert.equal(new Headers(requests[2].options.headers).get('Authorization'), 'Bearer saved-token');
  configureHttpAuth(() => 'test-token', async (token) => { rejected = token; });
  await http.get('/api/capsules');
  assert.equal(new Headers(requests[3].options.headers).get('Authorization'), 'Bearer test-token');
  status = 401;
  await assert.rejects(http.get('/api/capsules'), /expirada/);
  assert.equal(rejected, 'test-token');
  rejected = '';
  await assert.rejects(authApi.login({ email: 'user@example.com', password: 'wrong' }));
  assert.equal(rejected, '');
  configureHttpAuth(() => null, async () => {});
});

test('malformed API success is rejected before saving a session', async (t) => {
  const { authApi } = await import('../src/services/auth');
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 200 }));
  await assert.rejects(authApi.login({ email: 'user@example.com', password: 'password123' }), /inválida/);
  await assert.rejects(authApi.me('saved-token'), /inválida/);
});
