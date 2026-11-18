/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INVITE_CODE_MAX_LENGTH, normalizeInviteCode, validateInviteCode } from '../src/utils/inviteCode';

test('normalizeInviteCode strips spaces and hyphens and lowercases, as the API generates the code', () => {
  assert.equal(normalizeInviteCode(' k7q 2zx '), 'k7q2zx');
  assert.equal(normalizeInviteCode('K7Q-2ZX'), 'k7q2zx');
  assert.equal(normalizeInviteCode('9F86D081884C7D659A2FEAA0C55AD015'), '9f86d081884c7d659a2feaa0c55ad015');
  assert.equal(normalizeInviteCode(''), '');
});

test('validateInviteCode requires a non-empty alphanumeric code up to the API length', () => {
  assert.match(validateInviteCode('   ') ?? '', /Informe/);
  assert.match(validateInviteCode('K7Q#2ZX') ?? '', /inválido/);
  assert.match(validateInviteCode('a'.repeat(INVITE_CODE_MAX_LENGTH + 1)) ?? '', /inválido/);
  assert.equal(validateInviteCode('9f86d081884c7d659a2feaa0c55ad015'), undefined);
  assert.equal(validateInviteCode('k7q-2zx'), undefined);
});
