export function validateAuth(
  mode: 'login' | 'register',
  input: { name: string; email: string; password: string; confirmation: string },
): string | null {
  if (mode === 'register' && (!input.name.trim() || input.name.trim().length > 100)) {
    return 'Informe seu nome (até 100 caracteres).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || input.email.trim().length > 254) {
    return 'Informe um e-mail válido.';
  }
  if (!input.password) return 'Informe sua senha.';
  if (mode === 'register') {
    if (input.password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    const bytes = encodeURIComponent(input.password).replace(/%[A-F\d]{2}/gi, 'x').length;
    if (bytes > 72) return 'A senha é muito longa. Use até 72 bytes (acentos e emojis ocupam mais espaço).';
    if (input.password !== input.confirmation) return 'As senhas não coincidem.';
  }
  return null;
}
