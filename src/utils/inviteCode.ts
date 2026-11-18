/** Tamanho do código gerado pela API (16 bytes em hexadecimal). */
export const INVITE_CODE_MAX_LENGTH = 32;

/**
 * Remove espaços e hífens colados junto e padroniza em minúsculas: a API gera
 * o código em hexadecimal minúsculo e compara o valor exato.
 */
export function normalizeInviteCode(value: string): string {
  return value.replace(/[\s-]+/g, '').toLowerCase();
}

export function validateInviteCode(value: string): string | undefined {
  const code = normalizeInviteCode(value);
  if (!code) return 'Informe o código de convite.';
  if (code.length > INVITE_CODE_MAX_LENGTH || !/^[a-z0-9]+$/.test(code)) return 'Código de convite inválido.';
  return undefined;
}
