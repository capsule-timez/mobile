/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

test('sends a batch and reloads the authenticated invite list', async (t) => {
  const { listInvites, sendInvites } = await import('../src/services/invites');
  const { configureHttpAuth } = await import('../src/services/http');
  const invite = { id: 'i-1', email: 'amiga@example.com', status: 'PENDING' };
  const requests: string[] = [];

  configureHttpAuth(() => 'session', async () => {});
  t.after(() => configureHttpAuth(() => null, async () => {}));
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'http://localhost:3000/api/capsules/c%2F1/invites');
    assert.equal(new Headers(options.headers).get('Authorization'), 'Bearer session');
    requests.push(options.method!);
    if (options.method === 'POST') {
      assert.deepEqual(JSON.parse(String(options.body)), { emails: [invite.email, 'outro@example.com'] });
      return new Response(null, { status: 204 });
    }
    return Response.json({ data: [invite] });
  });

  await sendInvites('c/1', [invite.email, 'outro@example.com']);
  assert.deepEqual(await listInvites('c/1'), [invite]);
  assert.deepEqual(requests, ['POST', 'GET']);
});

test('accepts a token and preserves API messages for rejected invitations', async (t) => {
  const { acceptInvite } = await import('../src/services/invites');
  const failures = [
    [404, 'Convite inválido.'],
    [410, 'Convite expirado.'],
    [409, 'Convite já utilizado.'],
  ] as const;
  const responses = [
    Response.json({ capsuleId: 'c-1' }),
    ...failures.map(([status, message]) => Response.json({ message }, { status })),
  ];
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'http://localhost:3000/api/invites/abc%2F123/accept');
    assert.equal(options.method, 'POST');
    return responses.shift()!;
  });

  assert.equal(await acceptInvite('abc/123'), 'c-1');
  for (const [, message] of failures) {
    await assert.rejects(acceptInvite('abc/123'), { message });
  }
});
