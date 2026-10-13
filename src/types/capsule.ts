export type CapsuleStatus = 'SCHEDULED' | 'SENT' | 'FAILED';

export const CAPSULE_STATUSES: readonly CapsuleStatus[] = ['SCHEDULED', 'SENT', 'FAILED'];

export interface CapsuleSummary {
  id: string;
  title: string;
  recipientEmail: string;
  scheduleDate: string;
  status: CapsuleStatus;
  sentAt: string | null;
  createdAt: string;
  fileCount: number;
}

export interface CapsuleFile {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface Capsule extends Omit<CapsuleSummary, 'fileCount'> {
  text: string;
  files: CapsuleFile[];
}

export interface CreateCapsuleInput {
  title: string;
  text: string;
  recipientEmail: string;
  scheduleDate: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
