/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

// Formatos de GET /api/capsules/:id/invites e POST /api/capsules/:id/invites no backend.
const invite = {
  email: 'amiga@example.com',
  status: 'PENDING',
  sentAt: '2026-11-13T12:00:00.000Z',
  expiresAt: '2026-12-01T12:00:00.000Z',
  acceptedAt: null,
};
const results = [
  { email: 'amiga@example.com', result: 'SENT' },
  { email: 'outro@example.com', result: 'ALREADY_MEMBER' },
];

test('sends a batch, returns the result per e-mail and reads the list without ids', async (t) => {
  const { listInvites, sendInvites } = await import('../src/services/invites');
  const { configureHttpAuth } = await import('../src/services/http');
  const requests: string[] = [];

  configureHttpAuth(() => 'session', async () => {});
  t.after(() => configureHttpAuth(() => null, async () => {}));
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'http://localhost:3000/api/capsules/c%2F1/invites');
    assert.equal(new Headers(options.headers).get('Authorization'), 'Bearer session');
    requests.push(options.method!);
    if (options.method === 'POST') {
      assert.deepEqual(JSON.parse(String(options.body)), { emails: [invite.email, 'outro@example.com'] });
      return Response.json({ invites: results }, { status: 201 });
    }
    return Response.json({ data: [invite] });
  });

  assert.deepEqual(await sendInvites('c/1', [invite.email, 'outro@example.com']), results);
  assert.deepEqual(await listInvites('c/1'), [invite]);
  assert.deepEqual(requests, ['POST', 'GET']);
});

test('rejects invite responses outside the API contract', async (t) => {
  const { listInvites, sendInvites } = await import('../src/services/invites');
  const responses = [Response.json([invite]), Response.json({ data: [{ email: 'a@b.com' }] }), Response.json({ data: results })];
  t.mock.method(globalThis, 'fetch', async () => responses.shift()!);

  await assert.rejects(listInvites('c-1'), /inválidos/);
  await assert.rejects(listInvites('c-1'), /inválidos/);
  await assert.rejects(sendInvites('c-1', ['a@b.com']), /inválidos/);
});

test('accepts a token and takes the capsule id from the returned detail', async (t) => {
  const { acceptInvite } = await import('../src/services/invites');
  const responses = [Response.json({ id: 'c-1', title: 'Turma', participants: [] }), Response.json({ capsuleId: 'c-1' })];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'http://localhost:3000/api/invites/abc%2F123/accept');
    assert.equal(options.method, 'POST');
    return responses.shift()!;
  });

  assert.equal(await acceptInvite('abc/123'), 'c-1');
  await assert.rejects(acceptInvite('abc/123'), /inválidos/);
});

test('describeAcceptError explains invalid, used, expired and closed invites', async (t) => {
  const { acceptInvite, describeAcceptError } = await import('../src/services/invites');
  const responses = [
    Response.json({ status: 'error', code: 'NOT_FOUND', message: 'Convite não encontrado.' }, { status: 404 }),
    Response.json({ status: 'error', code: 'CONTRIBUTION_DEADLINE_PASSED', message: 'O prazo de contribuição desta cápsula já passou.' }, { status: 409 }),
    Response.json({ status: 'error', code: 'FORBIDDEN', message: 'Acesso negado' }, { status: 403 }),
    Response.json({ status: 'error', code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }, { status: 500 }),
  ];
  t.mock.method(globalThis, 'fetch', async () => responses.shift()!);
  const failure = async () => {
    try {
      await acceptInvite('t');
    } catch (error) {
      return describeAcceptError(error);
    }
    throw new Error('O aceite deveria ter falhado.');
  };

  assert.deepEqual(await failure(), { message: 'Este convite é inválido, expirou ou já foi utilizado.', retryable: false });
  assert.deepEqual(await failure(), { message: 'O prazo para entrar nesta cápsula já terminou.', retryable: false });
  assert.deepEqual(await failure(), { message: 'Acesso negado', retryable: false });
  assert.equal((await failure()).retryable, true);

  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network request failed'); });
  const offline = await failure();
  assert.equal(offline.retryable, true);
  assert.match(offline.message, /conectar/);
});
