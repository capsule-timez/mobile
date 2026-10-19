import type { AuthApi, AuthResult, User } from '../auth/session';
import { http } from './http';

function parseUser(value: unknown): User | null {
  if (
    !value || typeof value !== 'object' ||
    !('id' in value) || typeof value.id !== 'string' || !value.id ||
    !('name' in value) || typeof value.name !== 'string' ||
    !('email' in value) || typeof value.email !== 'string'
  ) return null;
  return { id: value.id, name: value.name, email: value.email };
}

function parseAuth(value: unknown): AuthResult {
  const user = value && typeof value === 'object' && 'user' in value ? parseUser(value.user) : null;
  if (
    !value || typeof value !== 'object' || !user ||
    !('token' in value) || typeof value.token !== 'string' || !value.token
  ) throw new Error('A API retornou uma sessão inválida. Tente novamente.');
  return { token: value.token, user };
}

export const authApi: AuthApi = {
  async login(input) {
    return parseAuth(await http.post('/api/auth/login', { email: input.email, password: input.password }, { authenticated: false }));
  },
  async register(input) {
    const created = await http.post<unknown>('/api/auth/register', input, { authenticated: false });
    try {
      return parseAuth(created);
    } catch {
      // A API atual cria a conta sem emitir token (a web também faz isso): entra em seguida.
      return parseAuth(await http.post('/api/auth/login', { email: input.email, password: input.password }, { authenticated: false }));
    }
  },
  async me(token) {
    const user = parseUser(await http.get<unknown>('/api/auth/me', {
      authenticated: false,
      headers: { Authorization: `Bearer ${token}` },
    }));
    if (!user) throw new Error('A API retornou uma sessão inválida.');
    return user;
  },
};
