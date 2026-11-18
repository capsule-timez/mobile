export type CapsuleStatus = 'SCHEDULED' | 'SENT' | 'FAILED';

export const CAPSULE_STATUSES: readonly CapsuleStatus[] = ['SCHEDULED', 'SENT', 'FAILED'];

export type CapsuleType = 'INDIVIDUAL' | 'GROUP';

export const CAPSULE_TYPES: readonly CapsuleType[] = ['INDIVIDUAL', 'GROUP'];

export type CapsuleMemberRole = 'OWNER' | 'MEMBER';

export interface CapsuleParticipant {
  name: string;
  role: CapsuleMemberRole;
  /** Só vem no detalhe. */
  hasContributed?: boolean;
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

export interface CapsuleContribution {
  id: string;
  author: { name: string };
  /** Nulo quando a contribuição tem só imagens. */
  text: string | null;
  createdAt: string;
  files: CapsuleFile[];
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
  /** Versões anteriores da API não enviavam: a cápsula em grupo é a que traz `participants`. */
  type?: CapsuleType;
  /** Presente apenas em cápsulas em grupo. */
  contributionDeadline?: string;
  /** Presente apenas em cápsulas em grupo. */
  participants?: CapsuleParticipant[];
}

export interface Capsule extends Omit<CapsuleSummary, 'fileCount'> {
  text: string;
  files: CapsuleFile[];
  /** Só em cápsulas GROUP, e no detalhe só para quem criou (OWNER). */
  inviteCode?: string;
  /** Presente apenas no detalhe de cápsulas em grupo, em ordem de envio. */
  contributions?: CapsuleContribution[];
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

/** PATCH /api/capsules/:id: só os campos que mudaram. */
export type UpdateCapsuleInput = Partial<Pick<CreateCapsuleInput, 'title' | 'text' | 'recipientEmail' | 'scheduleDate'>>;

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
