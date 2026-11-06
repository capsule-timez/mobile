/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

const summary = (overrides: Record<string, unknown> = {}) => ({
  id: 'c-1',
  title: 'Para mim',
  recipientEmail: 'user@example.com',
  scheduleDate: '2027-01-01T12:00:00.000Z',
  status: 'SCHEDULED',
  sentAt: null,
  createdAt: '2026-10-01T12:00:00.000Z',
  fileCount: 0,
  ...overrides,
});

const page = (data: unknown[], pageNumber: number, totalPages: number) => ({
  data,
  meta: { page: pageNumber, pageSize: 100, total: data.length, totalPages },
});

test('listCapsules follows pagination and sends the bearer token', async (t) => {
  const { listCapsules } = await import('../src/services/capsules');
  const { configureHttpAuth } = await import('../src/services/http');
  const requests: Array<{ url: string; headers: Headers }> = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    requests.push({ url, headers: new Headers(options.headers) });
    const second = url.includes('page=2');
    return new Response(JSON.stringify(second ? page([summary({ id: 'c-2' })], 2, 2) : page([summary()], 1, 2)), { status: 200 });
  });
  configureHttpAuth(() => 'test-token', async () => {});

  const capsules = await listCapsules();

  assert.deepEqual(capsules.map((capsule) => capsule.id), ['c-1', 'c-2']);
  assert.equal(requests[0].url, 'http://localhost:3000/api/capsules?page=1&pageSize=100');
  assert.equal(requests[1].url, 'http://localhost:3000/api/capsules?page=2&pageSize=100');
  assert.equal(requests[0].headers.get('Authorization'), 'Bearer test-token');
  configureHttpAuth(() => null, async () => {});
});

test('listCapsules rejects malformed responses instead of rendering them', async (t) => {
  const { listCapsules } = await import('../src/services/capsules');
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(page([summary({ status: 'UNKNOWN' })], 1, 1)), { status: 200 }));
  await assert.rejects(listCapsules(), /inválidos/);
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ data: 'x' }), { status: 200 }));
  await assert.rejects(listCapsules(), /inválidos/);
});

test('createCapsule posts the contract body and returns the created capsule', async (t) => {
  const { createCapsule } = await import('../src/services/capsules');
  const { configureHttpAuth } = await import('../src/services/http');
  const requests: Array<{ url: string; options: RequestInit }> = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ ...summary(), fileCount: undefined, text: 'Olá, futuro', files: [] }), { status: 201 });
  });
  configureHttpAuth(() => 'test-token', async () => {});

  const input = { title: 'Para mim', text: 'Olá, futuro', recipientEmail: 'user@example.com', scheduleDate: '2027-01-01T12:00:00.000Z' };
  const capsule = await createCapsule(input);

  assert.equal(requests[0].url, 'http://localhost:3000/api/capsules');
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].options.body as string), input);
  assert.equal(capsule.id, 'c-1');
  assert.equal(capsule.text, 'Olá, futuro');
  configureHttpAuth(() => null, async () => {});
});

test('createCapsule sends type and contributionDeadline for group capsules and returns the invite code', async (t) => {
  const { createCapsule } = await import('../src/services/capsules');
  const requests: Array<{ url: string; options: RequestInit }> = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({
      ...summary(), fileCount: undefined, text: 'Olá, turma', files: [],
      type: 'GROUP', inviteCode: 'K7Q2ZX', contributionDeadline: '2026-12-20T12:00:00.000Z',
    }), { status: 201 });
  });

  const input = {
    title: 'Turma 2026', text: 'Olá, turma', recipientEmail: 'user@example.com', scheduleDate: '2027-01-01T12:00:00.000Z',
    type: 'GROUP' as const, contributionDeadline: '2026-12-20T12:00:00.000Z',
  };
  const capsule = await createCapsule(input);

  assert.deepEqual(JSON.parse(requests[0].options.body as string), input);
  assert.equal(capsule.type, 'GROUP');
  assert.equal(capsule.inviteCode, 'K7Q2ZX');
  assert.equal(capsule.contributionDeadline, '2026-12-20T12:00:00.000Z');
});

test('createCapsule rejects a group capsule response without an invite code', async (t) => {
  const { createCapsule } = await import('../src/services/capsules');
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    ...summary(), fileCount: undefined, text: 'x', files: [], type: 'GROUP', contributionDeadline: '2026-12-20T12:00:00.000Z',
  }), { status: 201 }));
  await assert.rejects(createCapsule({
    title: 'a', text: 'x', recipientEmail: 'a@b.co', scheduleDate: '2027-01-01T12:00:00.000Z',
    type: 'GROUP', contributionDeadline: '2026-12-20T12:00:00.000Z',
  }), /inválidos/);
});

test('getApiErrorDetails exposes the API code and field errors', async (t) => {
  const { createCapsule, getApiErrorDetails } = await import('../src/services/capsules');
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    status: 'error',
    code: 'VALIDATION_ERROR',
    message: 'Dados invalidos',
    details: [{ field: 'scheduleDate', message: 'Deve ser uma data em UTC (sufixo Z) pelo menos 1 minuto no futuro' }],
  }), { status: 422 }));

  const failure = await createCapsule({ title: 'a', text: 'b', recipientEmail: 'a@b.co', scheduleDate: '2020-01-01T00:00:00.000Z' }).catch((error: unknown) => error);
  const details = getApiErrorDetails(failure);

  assert.equal(details.code, 'VALIDATION_ERROR');
  assert.equal(details.message, 'Dados invalidos');
  assert.match(details.fieldErrors.scheduleDate, /futuro/);
});

test('getApiErrorDetails falls back to the error message for connection failures', async (t) => {
  const { createCapsule, getApiErrorDetails } = await import('../src/services/capsules');
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network request failed'); });
  const failure = await createCapsule({ title: 'a', text: 'b', recipientEmail: 'a@b.co', scheduleDate: '2030-01-01T00:00:00.000Z' }).catch((error: unknown) => error);
  const details = getApiErrorDetails(failure);
  assert.equal(details.code, 'UNKNOWN');
  assert.match(details.message, /conectar/);
  assert.deepEqual(details.fieldErrors, {});
  assert.equal(getApiErrorDetails('boom').message, 'Erro inesperado. Tente novamente.');
});

test('getCapsule fetches the detail with attachments and the bearer token', async (t) => {
  const { getCapsule } = await import('../src/services/capsules');
  const { configureHttpAuth } = await import('../src/services/http');
  const requests: Array<{ url: string; headers: Headers }> = [];
  const file = { id: 'f-1', fileName: 'foto.jpg', mimeType: 'image/jpeg', fileSize: 2048, createdAt: '2026-10-01T12:00:00.000Z', downloadUrl: 'http://minio/foto.jpg?sig=1', downloadUrlExpiresAt: '2026-10-01T13:00:00.000Z' };
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    requests.push({ url, headers: new Headers(options.headers) });
    return new Response(JSON.stringify({ ...summary(), fileCount: undefined, text: 'Olá, futuro', files: [file] }), { status: 200 });
  });
  configureHttpAuth(() => 'test-token', async () => {});

  const capsule = await getCapsule('c-1');

  assert.equal(requests[0].url, 'http://localhost:3000/api/capsules/c-1');
  assert.equal(requests[0].headers.get('Authorization'), 'Bearer test-token');
  assert.equal(capsule.text, 'Olá, futuro');
  assert.equal(capsule.files[0].downloadUrl, file.downloadUrl);
  configureHttpAuth(() => null, async () => {});
});

test('getCapsule surfaces 404, offline API and malformed details as errors', async (t) => {
  const { getCapsule } = await import('../src/services/capsules');
  const { HttpError } = await import('../src/services/http');

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ status: 'error', code: 'NOT_FOUND', message: 'Capsula nao encontrada.' }), { status: 404 }));
  const notFound = await getCapsule('missing').catch((error: unknown) => error);
  assert.ok(notFound instanceof HttpError);
  assert.equal(notFound.status, 404);

  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network request failed'); });
  await assert.rejects(getCapsule('c-1'), /conectar/);

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ...summary(), text: 'x', files: 'nope' }), { status: 200 }));
  await assert.rejects(getCapsule('c-1'), /inválidos/);
});

test('uploadCapsuleFile posts one multipart file and validates the response', async (t) => {
  const { uploadCapsuleFile } = await import('../src/services/capsules');
  const { configureHttpAuth } = await import('../src/services/http');
  const requests: Array<{ url: string; options: RequestInit }> = [];
  const uploaded = { id: 'f-1', fileName: 'praia.jpg', mimeType: 'image/jpeg', fileSize: 1200, createdAt: '2026-10-01T12:00:00.000Z', downloadUrl: 'http://minio/f-1' };
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    requests.push({ url, options });
    return new Response(JSON.stringify(uploaded), { status: 201 });
  });
  configureHttpAuth(() => 'test-token', async () => {});

  const file = await uploadCapsuleFile('c-1', { uri: 'file:///cache/praia.jpg', name: 'praia.jpg', type: 'image/jpeg' });

  assert.equal(requests[0].url, 'http://localhost:3000/api/capsules/c-1/files');
  assert.equal(requests[0].options.method, 'POST');
  assert.ok(requests[0].options.body instanceof FormData);
  assert.ok((requests[0].options.body as FormData).has('file'));
  const headers = new Headers(requests[0].options.headers);
  assert.equal(headers.has('Content-Type'), false);
  assert.equal(headers.get('Authorization'), 'Bearer test-token');
  assert.deepEqual(file, uploaded);

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ id: 'f-1' }), { status: 201 }));
  await assert.rejects(uploadCapsuleFile('c-1', { uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' }), /inválidos/);
  configureHttpAuth(() => null, async () => {});
});

const groupDetail = (overrides: Record<string, unknown> = {}) => ({
  ...summary(), fileCount: undefined, text: 'Olá, turma', files: [],
  type: 'GROUP', contributionDeadline: '2026-12-20T12:00:00.000Z',
  members: [{ name: 'Ana', role: 'OWNER' }, { name: 'Bruno', role: 'MEMBER' }],
  ...overrides,
});

test('joinCapsule posts the normalized invite code and returns the capsule without requiring the code', async (t) => {
  const { joinCapsule } = await import('../src/services/capsules');
  const requests: Array<{ url: string; options: RequestInit }> = [];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    requests.push({ url, options });
    return new Response(JSON.stringify(groupDetail()), { status: 200 });
  });

  const capsule = await joinCapsule('  k7q-2zx ');

  assert.equal(requests[0].url, 'http://localhost:3000/api/capsules/join');
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].options.body as string), { inviteCode: 'K7Q2ZX' });
  assert.equal(capsule.type, 'GROUP');
  assert.equal(capsule.inviteCode, undefined);
  assert.deepEqual(capsule.members?.map((member) => member.role), ['OWNER', 'MEMBER']);
});

test('joinCapsule surfaces the API message for unknown codes and closed deadlines', async (t) => {
  const { joinCapsule, getApiErrorDetails } = await import('../src/services/capsules');
  const { HttpError } = await import('../src/services/http');

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ status: 'error', code: 'NOT_FOUND', message: 'Código de convite inválido.' }), { status: 404 }));
  const notFound = await joinCapsule('NOPE').catch((error: unknown) => error);
  assert.ok(notFound instanceof HttpError);
  assert.equal(getApiErrorDetails(notFound).message, 'Código de convite inválido.');

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ status: 'error', code: 'CONFLICT', message: 'O prazo de contribuição desta cápsula já terminou.' }), { status: 409 }));
  const closed = await joinCapsule('K7Q2ZX').catch((error: unknown) => error);
  assert.equal(getApiErrorDetails(closed).message, 'O prazo de contribuição desta cápsula já terminou.');
});

test('getCapsule accepts group members and rejects malformed ones', async (t) => {
  const { getCapsule } = await import('../src/services/capsules');
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(groupDetail({ inviteCode: 'K7Q2ZX' })), { status: 200 }));
  const capsule = await getCapsule('c-1');
  assert.equal(capsule.inviteCode, 'K7Q2ZX');
  assert.equal(capsule.members?.length, 2);

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(groupDetail({ members: [{ name: 'Ana', role: 'ADMIN' }] })), { status: 200 }));
  await assert.rejects(getCapsule('c-1'), /inválidos/);
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(groupDetail({ members: 'Ana' })), { status: 200 }));
  await assert.rejects(getCapsule('c-1'), /inválidos/);
});

test('listCapsules accepts the capsule type and rejects unknown ones', async (t) => {
  const { listCapsules } = await import('../src/services/capsules');
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(page([summary({ type: 'GROUP' }), summary({ id: 'c-2' })], 1, 1)), { status: 200 }));
  const capsules = await listCapsules();
  assert.deepEqual(capsules.map((capsule) => capsule.type), ['GROUP', undefined]);

  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(page([summary({ type: 'PAIR' })], 1, 1)), { status: 200 }));
  await assert.rejects(listCapsules(), /inválidos/);
});
