import { http } from './http';

export interface CapsuleInvite {
  id: string;
  email: string;
  status: string;
}

const invalidResponse = 'A API retornou dados de convite inválidos.';

function invitesPath(capsuleId: string) {
  return `/api/capsules/${encodeURIComponent(capsuleId)}/invites`;
}

function isInvite(value: unknown): value is CapsuleInvite {
  return typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'email' in value && typeof value.email === 'string' &&
    'status' in value && typeof value.status === 'string';
}

export async function listInvites(capsuleId: string, signal?: AbortSignal): Promise<CapsuleInvite[]> {
  const response = await http.get<unknown>(invitesPath(capsuleId), { signal });
  const invites = response && typeof response === 'object' && 'data' in response ? response.data : response;
  if (!Array.isArray(invites) || !invites.every(isInvite)) throw new Error(invalidResponse);
  return invites;
}

export async function sendInvites(capsuleId: string, emails: string[]): Promise<void> {
  await http.post(invitesPath(capsuleId), { emails });
}

export async function acceptInvite(token: string): Promise<string> {
  const response = await http.post<unknown>(`/api/invites/${encodeURIComponent(token)}/accept`);
  if (
    !response || typeof response !== 'object' ||
    !('capsuleId' in response) || typeof response.capsuleId !== 'string' || !response.capsuleId.trim()
  ) throw new Error(invalidResponse);
  return response.capsuleId;
}
