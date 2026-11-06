/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INVITE_CODE_MAX_LENGTH, normalizeInviteCode, validateInviteCode } from '../src/utils/inviteCode';

test('normalizeInviteCode strips spaces and hyphens and uppercases', () => {
  assert.equal(normalizeInviteCode(' k7q 2zx '), 'K7Q2ZX');
  assert.equal(normalizeInviteCode('k7q-2zx'), 'K7Q2ZX');
  assert.equal(normalizeInviteCode(''), '');
});

test('validateInviteCode requires a non-empty alphanumeric code', () => {
  assert.match(validateInviteCode('   ') ?? '', /Informe/);
  assert.match(validateInviteCode('K7Q#2ZX') ?? '', /inválido/);
  assert.match(validateInviteCode('A'.repeat(INVITE_CODE_MAX_LENGTH + 1)) ?? '', /inválido/);
  assert.equal(validateInviteCode('k7q-2zx'), undefined);
});
