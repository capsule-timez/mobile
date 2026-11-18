import type { Capsule, CapsuleParticipant, CapsuleSummary } from '../types/capsule';

const MAX_LISTED_PARTICIPANTS = 3;

export function formatParticipantNames(participants: CapsuleParticipant[]): string {
  const names = participants.slice(0, MAX_LISTED_PARTICIPANTS).map((person) => person.name).join(', ');
  const hidden = participants.length - MAX_LISTED_PARTICIPANTS;
  return hidden > 0 ? `${names} +${hidden}` : names;
}

/** A cápsula em grupo traz `type: 'GROUP'` ou, em versões anteriores da API, só `participants`. */
export function isGroupCapsule(capsule: Pick<CapsuleSummary, 'type' | 'participants'>): boolean {
  return capsule.type === 'GROUP' || Array.isArray(capsule.participants);
}

/** A API só envia o código de convite para quem criou a cápsula em grupo. */
export function isGroupOwner(capsule: Pick<Capsule, 'type' | 'participants' | 'inviteCode'>): boolean {
  return isGroupCapsule(capsule) && Boolean(capsule.inviteCode);
}

/**
 * Ainda dá para entrar e contribuir: agendada e antes do prazo. Sem o prazo na
 * resposta, quem decide é a API (409 CONTRIBUTION_DEADLINE_PASSED).
 */
export function isContributionOpen(
  capsule: Pick<Capsule, 'status' | 'contributionDeadline'>,
  now = Date.now(),
): boolean {
  if (capsule.status !== 'SCHEDULED') return false;
  return !capsule.contributionDeadline || Date.parse(capsule.contributionDeadline) > now;
}
