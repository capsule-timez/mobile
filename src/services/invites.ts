import { HttpError, http } from './http';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export interface CapsuleInvite {
  email: string;
  status: InviteStatus | (string & {});
  sentAt?: string;
  expiresAt?: string;
  acceptedAt?: string | null;
}

/** Resultado do envio para cada e-mail: o convite fica registrado mesmo quando o e-mail falha. */
export type InviteDelivery = 'SENT' | 'EMAIL_FAILED' | 'ALREADY_MEMBER';

export interface InviteResult {
  email: string;
  result: InviteDelivery | (string & {});
}

const invalidResponse = 'A API retornou dados de convite inválidos.';

function invitesPath(capsuleId: string) {
  return `/api/capsules/${encodeURIComponent(capsuleId)}/invites`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInvite(value: unknown): value is CapsuleInvite {
  return isRecord(value) && typeof value.email === 'string' && typeof value.status === 'string';
}

function isInviteResult(value: unknown): value is InviteResult {
  return isRecord(value) && typeof value.email === 'string' && typeof value.result === 'string';
}

/** GET devolve `{ data: CapsuleInvite[] }`; os itens não têm id, e o e-mail é único por cápsula. */
export async function listInvites(capsuleId: string, signal?: AbortSignal): Promise<CapsuleInvite[]> {
  const response = await http.get<unknown>(invitesPath(capsuleId), { signal });
  const invites = isRecord(response) ? response.data : undefined;
  if (!Array.isArray(invites) || !invites.every(isInvite)) throw new Error(invalidResponse);
  return invites;
}

/** POST devolve `{ invites: InviteResult[] }`, com o resultado de cada e-mail. */
export async function sendInvites(capsuleId: string, emails: string[]): Promise<InviteResult[]> {
  const response = await http.post<unknown>(invitesPath(capsuleId), { emails });
  const results = isRecord(response) ? response.invites : undefined;
  if (!Array.isArray(results) || !results.every(isInviteResult)) throw new Error(invalidResponse);
  return results;
}

/** Aceita o convite e devolve o id da cápsula, que vem no detalhe retornado pela API. */
export async function acceptInvite(token: string): Promise<string> {
  const response = await http.post<unknown>(`/api/invites/${encodeURIComponent(token)}/accept`);
  if (!isRecord(response) || typeof response.id !== 'string' || !response.id.trim()) throw new Error(invalidResponse);
  return response.id;
}

// A API responde 404 tanto para convite inexistente quanto para já usado ou expirado.
const NOT_FOUND_MESSAGE = 'Este convite é inválido, expirou ou já foi utilizado.';
const DEADLINE_MESSAGE = 'O prazo para entrar nesta cápsula já terminou.';

/** Mensagem amigável para a falha ao aceitar, e se vale a pena tentar de novo. */
export function describeAcceptError(error: unknown): { message: string; retryable: boolean } {
  if (!(error instanceof HttpError) || error.status >= 500) {
    return {
      message: error instanceof Error && error.message ? error.message : 'Erro inesperado. Tente novamente.',
      retryable: true,
    };
  }
  if (error.status === 404) return { message: NOT_FOUND_MESSAGE, retryable: false };
  const code = isRecord(error.body) ? error.body.code : undefined;
  if (code === 'CONTRIBUTION_DEADLINE_PASSED') return { message: DEADLINE_MESSAGE, retryable: false };
  const apiMessage = isRecord(error.body) && typeof error.body.message === 'string' ? error.body.message.trim() : '';
  return { message: apiMessage || NOT_FOUND_MESSAGE, retryable: false };
}
