import type { AuthApi, AuthResult } from '../auth/session';
import { http } from './http';

function parseAuth(value: unknown): AuthResult {
  if (
    !value || typeof value !== 'object' ||
    !('token' in value) || typeof value.token !== 'string' || !value.token ||
    !('user' in value) || !value.user || typeof value.user !== 'object' ||
    !('id' in value.user) || typeof value.user.id !== 'string' || !value.user.id
  ) throw new Error('A API retornou uma sessão inválida. Tente novamente.');
  return { token: value.token, user: { id: value.user.id } };
}

export const authApi: AuthApi = {
  async login(input) {
    return parseAuth(await http.post('/api/auth/login', { email: input.email, password: input.password }, { authenticated: false }));
  },
  async register(input) {
    return parseAuth(await http.post('/api/auth/register', input, { authenticated: false }));
  },
  async me(token) {
    const value = await http.get<{ id?: unknown }>('/api/auth/me', {
      authenticated: false,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!value || typeof value.id !== 'string' || !value.id) {
      throw new Error('A API retornou uma sessão inválida.');
    }
    return { userId: value.id };
  },
};
