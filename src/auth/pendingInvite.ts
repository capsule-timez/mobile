/**
 * Convite aberto antes do login. Ao entrar, o Stack.Protected leva para a lista
 * de cápsulas; a lista consome este token e volta para o convite, como a Web faz.
 */
let pendingInviteToken: string | null = null;

export function setPendingInvite(token: string): void {
  const value = token.trim();
  pendingInviteToken = value || null;
}

export function takePendingInvite(): string | null {
  const token = pendingInviteToken;
  pendingInviteToken = null;
  return token;
}
