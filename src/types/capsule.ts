export type CapsuleStatus = 'SCHEDULED' | 'SENT' | 'FAILED';

export const CAPSULE_STATUSES: readonly CapsuleStatus[] = ['SCHEDULED', 'SENT', 'FAILED'];

export type CapsuleType = 'INDIVIDUAL' | 'GROUP';

export const CAPSULE_TYPES: readonly CapsuleType[] = ['INDIVIDUAL', 'GROUP'];

export type CapsuleMemberRole = 'OWNER' | 'MEMBER';

export interface CapsuleMember {
  name: string;
  role: CapsuleMemberRole;
}

export interface CapsuleSummary {
  id: string;
  title: string;
  recipientEmail: string;
  scheduleDate: string;
  status: CapsuleStatus;
  sentAt: string | null;
  createdAt: string;
  fileCount: number;
  /** Ausente em respostas anteriores à cápsula em grupo: trate como INDIVIDUAL. */
  type?: CapsuleType;
}

export interface CapsuleFile {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
}

export interface Capsule extends Omit<CapsuleSummary, 'fileCount'> {
  creatorId?: string;
  text: string;
  files: CapsuleFile[];
  /** Só em cápsulas GROUP, e no detalhe só para o criador (OWNER). */
  inviteCode?: string;
  contributionDeadline?: string;
  /** Participantes da cápsula em grupo (só no detalhe). */
  members?: CapsuleMember[];
}

export interface CreateCapsuleInput {
  title: string;
  text: string;
  recipientEmail: string;
  scheduleDate: string;
  type?: CapsuleType;
  /** Obrigatório quando type é GROUP: antes de scheduleDate e no futuro. */
  contributionDeadline?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
