import type { Capsule, UpdateCapsuleInput } from '../types/capsule';
import type { CapsuleEditValues } from './capsuleValidation';

/** Só os campos que mudaram, no formato do PATCH /api/capsules/:id. */
export function capsuleChanges(
  capsule: Pick<Capsule, 'title' | 'text' | 'recipientEmail' | 'scheduleDate'>,
  values: CapsuleEditValues,
): UpdateCapsuleInput {
  const input: UpdateCapsuleInput = {};
  const title = values.title.trim();
  const text = values.text.trim();
  const recipientEmail = values.recipientEmail.trim();
  if (title !== capsule.title) input.title = title;
  if (text !== capsule.text) input.text = text;
  if (recipientEmail !== capsule.recipientEmail) input.recipientEmail = recipientEmail;
  if (values.scheduleDate && values.scheduleDate.getTime() !== Date.parse(capsule.scheduleDate)) {
    input.scheduleDate = values.scheduleDate.toISOString();
  }
  return input;
}
