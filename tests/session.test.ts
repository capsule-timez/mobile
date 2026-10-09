/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Session, type AuthApi, type TokenStorage } from '../src/auth/session';
import { validateAuth } from '../src/auth/validation';

function setup(saved: string | null = null) {
  const disk = { token: saved };
  const storage: TokenStorage = {
    async read() { return disk.token; },
    async write(token) { disk.token = token; },
    async remove() { disk.token = null; },
  };
  const api: AuthApi = {
    async login() { return { token: 'test-token', user: { id: 'user-1' } }; },
    async register() { return { token: 'registered-token', user: { id: 'user-2' } }; },
    async me(token) { assert.ok(token); return { userId: 'user-1' }; },
  };
  return { disk, storage, api, session: new Session(storage, api) };
}
const credentials = { email: 'user@example.com', password: 'password123' };

test('login persists the token and a fresh app instance restores the session', async () => {
  const { session, storage, api, disk } = setup();
  await session.restore();
  assert.equal(session.getSnapshot().status, 'signedOut');
  await session.authenticate('login', credentials);
  assert.equal(disk.token, 'test-token');
  const reopened = new Session(storage, api);
  assert.equal(reopened.getSnapshot().status, 'loading');
  await reopened.restore();
  assert.deepEqual(reopened.getSnapshot(), { status: 'signedIn', userId: 'user-1' });
  assert.equal(reopened.getToken(), 'test-token');
});

test('register starts an authenticated session', async () => {
  const { session, disk } = setup();
  await session.authenticate('register', { ...credentials, name: 'User' });
  assert.equal(disk.token, 'registered-token');
  assert.deepEqual(session.getSnapshot(), { status: 'signedIn', userId: 'user-2' });
});

test('expired token is removed on startup', async () => {
  const { session, api, disk } = setup('expired-token');
  api.me = async () => { throw { status: 401 }; };
  await session.restore();
  assert.equal(disk.token, null);
  assert.equal(session.getSnapshot().status, 'signedOut');
});

test('offline startup keeps saved token, offers retry and never opens protected screens', async () => {
  const { session, api, disk } = setup('valid-token');
  api.me = async () => { throw new Error('offline'); };
  await session.restore();
  assert.equal(session.getSnapshot().status, 'error');
  assert.equal(session.getToken(), null);
  assert.equal(disk.token, 'valid-token');
  api.me = async () => ({ userId: 'user-1' });
  await session.restore();
  assert.equal(session.getSnapshot().status, 'signedIn');
});

test('storage failure does not authenticate or silently discard the error', async () => {
  const { session, storage } = setup();
  await session.restore();
  storage.write = async () => { throw new Error('locked'); };
  await assert.rejects(session.authenticate('login', credentials), /segurança/);
  assert.equal(session.getSnapshot().status, 'signedOut');
  assert.equal(session.getToken(), null);
});

test('logout removes token across app restarts', async () => {
  const { session, storage, api, disk } = setup();
  await session.authenticate('login', credentials);
  await session.signOut();
  assert.equal(disk.token, null);
  assert.equal(session.getToken(), null);
  const reopened = new Session(storage, api);
  await reopened.restore();
  assert.equal(reopened.getSnapshot().status, 'signedOut');
});

test('failed logout reports an error instead of claiming persistent logout', async () => {
  const { session, storage } = setup();
  await session.authenticate('login', credentials);
  storage.remove = async () => { throw new Error('locked'); };
  await assert.rejects(session.signOut(), /segurança/);
  assert.equal(session.getSnapshot().status, 'signedIn');
});

test('stale unauthorized response cannot clear a newer session', async () => {
  const { session, disk } = setup();
  await session.authenticate('login', credentials);
  await session.invalidate('old-token');
  assert.equal(session.getSnapshot().status, 'signedIn');
  await session.invalidate('test-token');
  assert.equal(session.getSnapshot().status, 'signedOut');
  assert.equal(disk.token, null);
});

test('duplicate submissions create only one request', async () => {
  const { session, api } = setup();
  let calls = 0;
  let finish!: (result: { token: string; user: { id: string } }) => void;
  api.login = () => { calls++; return new Promise((resolve) => { finish = resolve; }); };
  const pending = session.authenticate('login', credentials);
  await session.authenticate('login', credentials);
  finish({ token: 'test-token', user: { id: 'user-1' } });
  await pending;
  assert.equal(calls, 1);
});

test('form validation catches email, confirmation and UTF-8 bcrypt limit', () => {
  const input = { ...credentials, name: 'User', confirmation: credentials.password };
  assert.equal(validateAuth('register', input), null);
  assert.match(validateAuth('register', { ...input, email: 'invalid' })!, /e-mail/);
  assert.match(validateAuth('register', { ...input, confirmation: 'different' })!, /coincidem/);
  assert.match(validateAuth('register', { ...input, password: 'é'.repeat(37) })!, /longa/);
  assert.equal(validateAuth('login', { ...input, name: '', password: 'x', confirmation: '' }), null);
});
