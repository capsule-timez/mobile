/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countByStatus, getDeliveryProgress, sortCapsules } from '../src/utils/capsuleList';
import {
  SCHEDULE_PRESETS,
  applySchedulePreset,
  formatDateTimeInput,
  getMinScheduleDate,
  parseDateTimeInput,
  validateCapsuleForm,
  validateScheduleDate,
  type CapsuleFormValues,
} from '../src/utils/capsuleValidation';
import { formatDateTime, formatRelativeTime, isInFuture } from '../src/utils/formatDate';
import type { CapsuleSummary } from '../src/types/capsule';

const NOW = new Date(2026, 9, 12, 20, 0, 0); // 12/10/2026 20:00, fuso local

const validValues = (overrides: Partial<CapsuleFormValues> = {}): CapsuleFormValues => ({
  title: 'Para mim',
  text: 'Olá, futuro',
  scheduleDate: new Date(NOW.getTime() + 24 * 3_600_000),
  recipientMode: 'self',
  recipientEmail: '',
  ...overrides,
});

test('form validation accepts a complete capsule', () => {
  assert.deepEqual(validateCapsuleForm(validValues(), NOW), {});
});

test('form validation reports every invalid field', () => {
  const errors = validateCapsuleForm(
    validValues({ title: '  ', text: '', scheduleDate: null, recipientMode: 'other', recipientEmail: 'sem-arroba' }),
    NOW,
  );
  assert.deepEqual(Object.keys(errors).sort(), ['recipientEmail', 'scheduleDate', 'text', 'title']);
});

test('form validation enforces the API limits', () => {
  assert.match(validateCapsuleForm(validValues({ title: 'a'.repeat(121) }), NOW).title!, /120/);
  assert.match(validateCapsuleForm(validValues({ text: 'a'.repeat(10_001) }), NOW).text!, /10\.000/);
  assert.equal(validateCapsuleForm(validValues({ title: 'a'.repeat(120), text: 'a'.repeat(10_000) }), NOW).title, undefined);
});

test('recipient e-mail is only validated when sending to someone else', () => {
  assert.equal(validateCapsuleForm(validValues({ recipientEmail: 'lixo' }), NOW).recipientEmail, undefined);
  assert.equal(validateCapsuleForm(validValues({ recipientMode: 'other', recipientEmail: 'ana@exemplo.com' }), NOW).recipientEmail, undefined);
});

test('schedule date needs a safe lead time over the API minimum', () => {
  assert.match(validateScheduleDate(new Date(NOW.getTime() + 30_000), NOW)!, /futuro/);
  assert.match(validateScheduleDate(new Date(NOW.getTime() - 3_600_000), NOW)!, /futuro/);
  assert.equal(validateScheduleDate(new Date(NOW.getTime() + 3 * 60_000), NOW), undefined);
  assert.match(validateScheduleDate(new Date('x'), NOW)!, /inválida/);
  // O mínimo sugerido ao seletor já passa na validação.
  assert.equal(validateScheduleDate(getMinScheduleDate(NOW), NOW), undefined);
});

test('presets move the date forward from now with seconds zeroed', () => {
  const dates = Object.fromEntries(SCHEDULE_PRESETS.map((preset) => [preset.label, applySchedulePreset(preset.apply, new Date(2026, 9, 12, 20, 0, 45))]));
  assert.equal(dates['Amanhã'].getDate(), 13);
  assert.equal(dates['Em 1 semana'].getDate(), 19);
  assert.equal(dates['Em 1 mês'].getMonth(), 10);
  assert.equal(dates['Em 1 ano'].getFullYear(), 2027);
  for (const date of Object.values(dates)) assert.equal(date.getSeconds(), 0);
});

test('web text input round-trips and rejects impossible dates', () => {
  const date = new Date(2026, 9, 12, 8, 5);
  assert.equal(formatDateTimeInput(date), '2026-10-12 08:05');
  assert.equal(parseDateTimeInput('2026-10-12 08:05')?.getTime(), date.getTime());
  assert.equal(parseDateTimeInput('2026-10-12T08:05')?.getTime(), date.getTime());
  assert.equal(parseDateTimeInput('2026-02-30 10:00'), null);
  assert.equal(parseDateTimeInput('12/10/2026'), null);
});

test('date and relative time are formatted in pt-BR', () => {
  assert.equal(formatDateTime(new Date(2026, 9, 12, 20, 45).toISOString()), '12 de outubro de 2026 às 20:45');
  const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  assert.equal(formatRelativeTime(at(10_000), NOW.getTime()), 'agora');
  assert.equal(formatRelativeTime(at(5 * minute), NOW.getTime()), 'em 5 minutos');
  assert.equal(formatRelativeTime(at(-hour), NOW.getTime()), 'há 1 hora');
  assert.equal(formatRelativeTime(at(day), NOW.getTime()), 'amanhã');
  assert.equal(formatRelativeTime(at(-day), NOW.getTime()), 'ontem');
  assert.equal(formatRelativeTime(at(3 * day), NOW.getTime()), 'em 3 dias');
  assert.equal(formatRelativeTime(at(-10 * day), NOW.getTime()), 'há 10 dias');
  assert.equal(formatRelativeTime(at(60 * day), NOW.getTime()), 'em 2 meses');
  assert.equal(formatRelativeTime(at(400 * day), NOW.getTime()), 'ano que vem');
  assert.equal(formatRelativeTime(at(-800 * day), NOW.getTime()), 'há 2 anos');
  assert.equal(isInFuture(at(1), NOW.getTime()), true);
  assert.equal(isInFuture(at(-1), NOW.getTime()), false);
});

const capsule = (id: string, status: CapsuleSummary['status'], scheduleDate: string): CapsuleSummary => ({
  id, status, scheduleDate, title: id, recipientEmail: 'a@b.co', sentAt: null, createdAt: '2026-01-01T00:00:00.000Z', fileCount: 0,
});

test('list puts upcoming deliveries first and history newest first', () => {
  const sorted = sortCapsules([
    capsule('old-sent', 'SENT', '2026-02-01T00:00:00.000Z'),
    capsule('later', 'SCHEDULED', '2027-06-01T00:00:00.000Z'),
    capsule('new-failed', 'FAILED', '2026-05-01T00:00:00.000Z'),
    capsule('soon', 'SCHEDULED', '2027-01-01T00:00:00.000Z'),
  ]);
  assert.deepEqual(sorted.map((item) => item.id), ['soon', 'later', 'new-failed', 'old-sent']);
  assert.equal(countByStatus(sorted, 'SCHEDULED'), 2);
  assert.equal(countByStatus(sorted, 'SENT'), 1);
});

test('delivery progress is clamped between creation and schedule date', () => {
  const base = { createdAt: '2026-01-01T00:00:00.000Z', scheduleDate: '2026-01-11T00:00:00.000Z' };
  const day = 24 * 3_600_000;
  const start = Date.parse(base.createdAt);
  assert.equal(getDeliveryProgress(base, start - day), 0);
  assert.equal(getDeliveryProgress(base, start + 5 * day), 0.5);
  assert.equal(getDeliveryProgress(base, start + 99 * day), 1);
  assert.equal(getDeliveryProgress({ createdAt: base.scheduleDate, scheduleDate: base.createdAt }), 1);
});
