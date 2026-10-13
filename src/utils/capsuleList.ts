import type { CapsuleStatus, CapsuleSummary } from '../types/capsule';

export function sortCapsules(capsules: CapsuleSummary[]): CapsuleSummary[] {
  const upcoming = capsules
    .filter((capsule) => capsule.status === 'SCHEDULED')
    .sort((a, b) => Date.parse(a.scheduleDate) - Date.parse(b.scheduleDate));
  const history = capsules
    .filter((capsule) => capsule.status !== 'SCHEDULED')
    .sort((a, b) => Date.parse(b.scheduleDate) - Date.parse(a.scheduleDate));
  return [...upcoming, ...history];
}

export function countByStatus(capsules: CapsuleSummary[], status: CapsuleStatus): number {
  return capsules.filter((capsule) => capsule.status === status).length;
}

export function getDeliveryProgress(
  capsule: Pick<CapsuleSummary, 'createdAt' | 'scheduleDate'>,
  now = Date.now(),
): number {
  const start = Date.parse(capsule.createdAt);
  const end = Date.parse(capsule.scheduleDate);
  if (!(end > start)) return 1;
  return Math.min(Math.max((now - start) / (end - start), 0), 1);
}
