const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateTime(iso: string): string {
  return formatDateTimeFromDate(new Date(iso));
}

export function formatDateTimeFromDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Unit = 'minute' | 'hour' | 'day' | 'month' | 'year';

const UNIT_NAMES: Record<Unit, [singular: string, plural: string]> = {
  minute: ['minuto', 'minutos'],
  hour: ['hora', 'horas'],
  day: ['dia', 'dias'],
  month: ['mês', 'meses'],
  year: ['ano', 'anos'],
};

// Expressões idiomáticas de `numeric: 'auto'` do Intl.RelativeTimeFormat pt-BR.
const SPECIAL: Partial<Record<Unit, Record<number, string>>> = {
  day: { [-2]: 'anteontem', [-1]: 'ontem', 0: 'hoje', 1: 'amanhã', 2: 'depois de amanhã' },
  month: { [-1]: 'mês passado', 1: 'mês que vem' },
  year: { [-1]: 'ano passado', 1: 'ano que vem' },
};

function relative(value: number, unit: Unit): string {
  const special = SPECIAL[unit]?.[value];
  if (special) return special;
  const amount = Math.abs(value);
  const [singular, plural] = UNIT_NAMES[unit];
  const label = `${amount} ${amount === 1 ? singular : plural}`;
  return value < 0 ? `há ${label}` : `em ${label}`;
}

/** "em 3 dias", "há 2 horas", "amanhã", "agora"… relativo a `now`. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diff = Date.parse(iso) - now;
  const abs = Math.abs(diff);

  if (abs < MINUTE) return 'agora';
  if (abs < HOUR) return relative(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return relative(Math.round(diff / HOUR), 'hour');
  if (abs < 30 * DAY) return relative(Math.round(diff / DAY), 'day');
  if (abs < 365 * DAY) return relative(Math.round(diff / (30 * DAY)), 'month');
  return relative(Math.round(diff / (365 * DAY)), 'year');
}

export function isInFuture(iso: string, now = Date.now()): boolean {
  return Date.parse(iso) > now;
}
