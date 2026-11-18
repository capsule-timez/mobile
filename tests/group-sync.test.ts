/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setPendingInvite, takePendingInvite } from '../src/auth/pendingInvite';
import { capsuleChanges } from '../src/utils/capsuleEdit';
import { formatParticipantNames, isContributionOpen, isGroupCapsule, isGroupOwner } from '../src/utils/capsuleGroup';
import { CONTRIBUTION_TEXT_MAX_LENGTH, validateCapsuleEdit, validateContributionText } from '../src/utils/capsuleValidation';
import { MAX_INVITES_PER_REQUEST, parseInviteEmails, validateInviteEmails } from '../src/utils/inviteEmails';

const NOW = Date.parse('2026-11-17T12:00:00.000Z');

test('group capsules are recognized by type or by the participants the API sends only for groups', () => {
  assert.equal(isGroupCapsule({ type: 'GROUP' }), true);
  assert.equal(isGroupCapsule({ participants: [] }), true);
  assert.equal(isGroupCapsule({ type: 'INDIVIDUAL' }), false);
  assert.equal(isGroupCapsule({}), false);
});

test('only the owner, who receives the invite code, manages the group', () => {
  const participants = [{ name: 'Ana', role: 'OWNER' as const }];
  assert.equal(isGroupOwner({ participants, inviteCode: 'a1b2' }), true);
  assert.equal(isGroupOwner({ participants }), false);
  assert.equal(isGroupOwner({ inviteCode: 'a1b2' }), false);
});

test('contributions stay open while scheduled and before the deadline, when the API sends one', () => {
  assert.equal(isContributionOpen({ status: 'SCHEDULED' }, NOW), true);
  assert.equal(isContributionOpen({ status: 'SCHEDULED', contributionDeadline: '2026-11-18T12:00:00.000Z' }, NOW), true);
  assert.equal(isContributionOpen({ status: 'SCHEDULED', contributionDeadline: '2026-11-16T12:00:00.000Z' }, NOW), false);
  assert.equal(isContributionOpen({ status: 'SENT' }, NOW), false);
});

test('formatParticipantNames lists up to three names', () => {
  const people = ['Ana', 'Bruno', 'Carla', 'Davi'].map((name) => ({ name, role: 'MEMBER' as const }));
  assert.equal(formatParticipantNames(people.slice(0, 3)), 'Ana, Bruno, Carla');
  assert.equal(formatParticipantNames(people), 'Ana, Bruno, Carla +1');
});

test('a contribution needs a text or an image, with up to 2,000 characters', () => {
  assert.equal(validateContributionText('Oi', 0), undefined);
  assert.equal(validateContributionText('  ', 1), undefined);
  assert.equal(validateContributionText('  ', 0), 'Escreva uma mensagem ou escolha ao menos uma imagem.');
  assert.equal(validateContributionText('a'.repeat(CONTRIBUTION_TEXT_MAX_LENGTH), 0), undefined);
  assert.match(validateContributionText('a'.repeat(CONTRIBUTION_TEXT_MAX_LENGTH + 1), 3) ?? '', /2\.000/);
});

test('editing validates the same fields as creation, including the recipient', () => {
  const now = new Date(NOW);
  const values = { title: 'Carta', text: 'Olá', recipientEmail: 'ana@example.com', scheduleDate: new Date(NOW + 86_400_000) };
  assert.deepEqual(validateCapsuleEdit(values, now), {});
  const errors = validateCapsuleEdit({ title: ' ', text: '', recipientEmail: 'x', scheduleDate: new Date(NOW - 1000) }, now);
  assert.deepEqual(Object.keys(errors).sort(), ['recipientEmail', 'scheduleDate', 'text', 'title']);
});

test('capsuleChanges sends only what changed', () => {
  const capsule = { title: 'Carta', text: 'Olá', recipientEmail: 'ana@example.com', scheduleDate: '2027-01-01T12:00:00.000Z' };
  const same = { title: ' Carta ', text: 'Olá', recipientEmail: 'ana@example.com', scheduleDate: new Date(capsule.scheduleDate) };
  assert.deepEqual(capsuleChanges(capsule, same), {});
  const later = new Date('2027-02-01T12:00:00.000Z');
  assert.deepEqual(capsuleChanges(capsule, { ...same, title: 'Nova', scheduleDate: later }), {
    title: 'Nova',
    scheduleDate: later.toISOString(),
  });
});

test('invite e-mails are deduplicated, validated and limited to 20 per request', () => {
  assert.deepEqual(parseInviteEmails('Ana@Example.com, bruno@example.com\nana@example.com'), ['ana@example.com', 'bruno@example.com']);
  assert.equal(validateInviteEmails([]), 'Informe ao menos um e-mail.');
  assert.equal(validateInviteEmails(['ana@example.com', 'bruno@']), 'E-mail inválido: bruno@');
  const many = Array.from({ length: MAX_INVITES_PER_REQUEST + 1 }, (_, index) => `p${index}@example.com`);
  assert.match(validateInviteEmails(many) ?? '', /no máximo 20/);
  assert.equal(validateInviteEmails(many.slice(0, MAX_INVITES_PER_REQUEST)), undefined);
});

test('the invite opened before login is returned once after signing in', () => {
  assert.equal(takePendingInvite(), null);
  setPendingInvite('  tk-1 ');
  assert.equal(takePendingInvite(), 'tk-1');
  assert.equal(takePendingInvite(), null);
  setPendingInvite('   ');
  assert.equal(takePendingInvite(), null);
});
