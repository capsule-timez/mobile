// Limites espelhados do contrato da API (backend src/schemas/capsule.schema.ts).
export const TITLE_MAX_LENGTH = 120;
export const TEXT_MAX_LENGTH = 10_000;
export const EMAIL_MAX_LENGTH = 254;
/** A API exige pelo menos 1 minuto de antecedência; a interface usa 2 por folga. */
export const MIN_SCHEDULE_LEAD_MS = 2 * 60_000;

export type RecipientMode = 'self' | 'other';

export interface CapsuleFormValues {
  title: string;
  text: string;
  scheduleDate: Date | null;
  recipientMode: RecipientMode;
  recipientEmail: string;
}

export type CapsuleFormField = 'title' | 'text' | 'scheduleDate' | 'recipientEmail';

export type CapsuleFormErrors = Partial<Record<CapsuleFormField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getMinScheduleDate(now = new Date()): Date {
  const min = new Date(now.getTime() + MIN_SCHEDULE_LEAD_MS);
  min.setSeconds(0, 0);
  min.setMinutes(min.getMinutes() + 1);
  return min;
}

export function validateScheduleDate(value: Date | null, now = new Date()): string | undefined {
  if (!value) return 'Escolha a data de entrega.';
  if (Number.isNaN(value.getTime())) return 'Data inválida.';
  if (value.getTime() < now.getTime() + MIN_SCHEDULE_LEAD_MS) {
    return 'A data de entrega precisa estar no futuro.';
  }
  return undefined;
}

export function validateCapsuleForm(values: CapsuleFormValues, now = new Date()): CapsuleFormErrors {
  const errors: CapsuleFormErrors = {};
  const title = values.title.trim();
  const text = values.text.trim();

  if (!title) errors.title = 'Informe um título.';
  else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres.`;
  }

  if (!text) errors.text = 'Escreva a mensagem da cápsula.';
  else if (text.length > TEXT_MAX_LENGTH) {
    errors.text = 'A mensagem deve ter no máximo 10.000 caracteres.';
  }

  const scheduleError = validateScheduleDate(values.scheduleDate, now);
  if (scheduleError) errors.scheduleDate = scheduleError;

  if (values.recipientMode === 'other') {
    const email = values.recipientEmail.trim();
    if (!email) errors.recipientEmail = 'Informe o e-mail do destinatário.';
    else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      errors.recipientEmail = 'Informe um e-mail válido.';
    }
  }

  return errors;
}

export const SCHEDULE_PRESETS: { label: string; apply: (date: Date) => void }[] = [
  { label: 'Amanhã', apply: (date) => date.setDate(date.getDate() + 1) },
  { label: 'Em 1 semana', apply: (date) => date.setDate(date.getDate() + 7) },
  { label: 'Em 1 mês', apply: (date) => date.setMonth(date.getMonth() + 1) },
  { label: 'Em 1 ano', apply: (date) => date.setFullYear(date.getFullYear() + 1) },
];

export function applySchedulePreset(apply: (date: Date) => void, now = new Date()): Date {
  const date = new Date(now.getTime());
  apply(date);
  date.setSeconds(0, 0);
  return date;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateTimeInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDateTimeInput(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day &&
    date.getHours() === hour && date.getMinutes() === minute;
  return valid ? date : null;
}
