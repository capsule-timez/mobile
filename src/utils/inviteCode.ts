/** Tamanho máximo aceito no campo; o código real é bem menor, isso só evita colagens gigantes. */
export const INVITE_CODE_MAX_LENGTH = 32;

/** Remove espaços e hífens colados junto e padroniza em maiúsculas, como o código é exibido. */
export function normalizeInviteCode(value: string): string {
  return value.replace(/[\s-]+/g, '').toUpperCase();
}

export function validateInviteCode(value: string): string | undefined {
  const code = normalizeInviteCode(value);
  if (!code) return 'Informe o código de convite.';
  if (code.length > INVITE_CODE_MAX_LENGTH || !/^[A-Z0-9]+$/.test(code)) return 'Código de convite inválido.';
  return undefined;
}
