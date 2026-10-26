import { CAPSULE_STATUSES, type Capsule, type CapsuleFile, type CapsuleSummary, type CreateCapsuleInput, type PaginatedResponse } from '../types/capsule';
import { HttpError, http } from './http';

const PAGE_SIZE = 100; 
const MAX_PAGES = 20;
const INVALID_RESPONSE = 'A API retornou dados inválidos. Tente novamente.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSummary(value: unknown): value is CapsuleSummary {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.recipientEmail === 'string' &&
    typeof value.scheduleDate === 'string' && !Number.isNaN(Date.parse(value.scheduleDate)) &&
    typeof value.createdAt === 'string' &&
    (value.sentAt === null || typeof value.sentAt === 'string') &&
    typeof value.fileCount === 'number' &&
    CAPSULE_STATUSES.includes(value.status as CapsuleSummary['status'])
  );
}

function parsePage(value: unknown): PaginatedResponse<CapsuleSummary> {
  if (
    !isRecord(value) || !Array.isArray(value.data) || !value.data.every(isSummary) ||
    !isRecord(value.meta) || typeof value.meta.totalPages !== 'number'
  ) throw new Error(INVALID_RESPONSE);
  return value as unknown as PaginatedResponse<CapsuleSummary>;
}

function parseCapsule(value: unknown): Capsule {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.text !== 'string' ||
    typeof value.scheduleDate !== 'string' || Number.isNaN(Date.parse(value.scheduleDate))
  ) throw new Error(INVALID_RESPONSE);
  return value as unknown as Capsule;
}

function isFile(value: unknown): value is CapsuleFile {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.fileName === 'string' &&
    typeof value.mimeType === 'string' &&
    typeof value.fileSize === 'number' &&
    (value.downloadUrl === undefined || typeof value.downloadUrl === 'string')
  );
}

function parseCapsuleDetail(value: unknown): Capsule {
  const capsule = parseCapsule(value);
  if (
    typeof capsule.recipientEmail !== 'string' ||
    !CAPSULE_STATUSES.includes(capsule.status) ||
    !Array.isArray(capsule.files) || !capsule.files.every(isFile)
  ) throw new Error(INVALID_RESPONSE);
  return capsule;
}

export async function listCapsules(signal?: AbortSignal): Promise<CapsuleSummary[]> {
  const capsules: CapsuleSummary[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = parsePage(await http.get<unknown>(`/api/capsules?page=${page}&pageSize=${PAGE_SIZE}`, { signal }));
    capsules.push(...result.data);
    if (page >= result.meta.totalPages) break;
  }
  return capsules;
}

export async function getCapsule(id: string, signal?: AbortSignal): Promise<Capsule> {
  return parseCapsuleDetail(await http.get<unknown>(`/api/capsules/${encodeURIComponent(id)}`, { signal }));
}

export async function deleteCapsule(id: string): Promise<void> {
  await http.delete<void>(`/api/capsules/${encodeURIComponent(id)}`);
}

export async function createCapsule(input: CreateCapsuleInput): Promise<Capsule> {
  return parseCapsule(await http.post<unknown>('/api/capsules', input));
}

export interface ApiErrorDetails {
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
}

export function getApiErrorDetails(error: unknown): ApiErrorDetails {
  const fallback = 'Erro inesperado. Tente novamente.';

  if (error instanceof HttpError) {
    const body = isRecord(error.body) ? error.body : {};
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(body.details)) {
      for (const detail of body.details) {
        if (isRecord(detail) && typeof detail.field === 'string' && typeof detail.message === 'string') {
          fieldErrors[detail.field] = detail.message;
        }
      }
    }
    return {
      code: typeof body.code === 'string' ? body.code : 'UNKNOWN',
      message: error.message || fallback,
      fieldErrors,
    };
  }

  return { code: 'UNKNOWN', message: error instanceof Error && error.message ? error.message : fallback, fieldErrors: {} };
}
