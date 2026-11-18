/** Limite de e-mails por envio, igual ao da API. */
export const MAX_INVITES_PER_REQUEST = 20;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Separa por vírgula, ponto e vírgula, espaço ou quebra de linha e remove repetidos. */
export function parseInviteEmails(input: string): string[] {
  return [...new Set(input.toLowerCase().split(/[\s,;]+/).filter(Boolean))];
}

/** Erro do campo antes de chamar a API, ou undefined quando a lista é válida. */
export function validateInviteEmails(emails: string[]): string | undefined {
  if (!emails.length) return 'Informe ao menos um e-mail.';
  const invalid = emails.filter((email) => email.length > 254 || !EMAIL_PATTERN.test(email));
  if (invalid.length) return `E-mail inválido: ${invalid.join(', ')}`;
  if (emails.length > MAX_INVITES_PER_REQUEST) return `Envie no máximo ${MAX_INVITES_PER_REQUEST} e-mails por vez.`;
  return undefined;
}
