export type Credentials = { email: string; password: string };
export type Registration = Credentials & { name: string };
export type AuthResult = { token: string; user: { id: string } };
export type SessionState =
  | { status: 'loading' } | { status: 'signedOut' }
  | { status: 'signedIn'; userId: string }
  | { status: 'error'; message: string };

export interface TokenStorage {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  remove(): Promise<void>;
}
export interface AuthApi {
  login(input: Credentials): Promise<AuthResult>;
  register(input: Registration): Promise<AuthResult>;
  me(token: string): Promise<{ userId: string }>;
}

// Only the token is persisted, through the injected secure storage.
export class Session {
  private token: string | null = null;
  private state: SessionState = { status: 'loading' };
  private listeners = new Set<() => void>();
  private pending = false;

  constructor(private storage: TokenStorage, private api: AuthApi) {}

  getSnapshot = () => this.state;
  getToken = () => this.token;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(state: SessionState) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }

  restore = async () => {
    if (this.pending) return;
    this.pending = true;
    this.token = null;
    this.update({ status: 'loading' });
    try {
      const token = await this.storage.read();
      if (!token) {
        this.update({ status: 'signedOut' });
        return;
      }
      try {
        const user = await this.api.me(token);
        this.token = token;
        this.update({ status: 'signedIn', userId: user.userId });
      } catch (error) {
        if (isUnauthorized(error)) {
          await this.storage.remove();
          this.update({ status: 'signedOut' });
        } else {
          // A network failure must not erase a valid saved session.
          throw error;
        }
      }
    } catch {
      this.update({ status: 'error', message: 'Não foi possível recuperar sua sessão. Verifique a conexão e tente novamente.' });
    } finally {
      this.pending = false;
    }
  };

  authenticate = async (kind: 'login' | 'register', input: Registration | Credentials) => {
    if (this.pending) return;
    this.pending = true;
    try {
      const result = kind === 'register'
        ? await this.api.register(input as Registration)
        : await this.api.login(input);
      try {
        await this.storage.write(result.token);
      } catch {
        throw new Error('Não foi possível salvar a sessão com segurança. Tente entrar novamente.');
      }
      this.token = result.token;
      this.update({ status: 'signedIn', userId: result.user.id });
    } finally {
      this.pending = false;
    }
  };

  signOut = async () => {
    // Do not claim success until the persisted token has been removed.
    try {
      await this.storage.remove();
    } catch {
      throw new Error('Não foi possível encerrar a sessão com segurança. Tente novamente.');
    }
    this.token = null;
    this.update({ status: 'signedOut' });
  };

  invalidate = async (rejectedToken: string) => {
    if (this.token !== rejectedToken) return;
    this.token = null;
    this.update({ status: 'loading' });
    try {
      await this.storage.remove();
      this.update({ status: 'signedOut' });
    } catch {
      this.update({ status: 'error', message: 'Sua sessão expirou, mas não foi possível limpar o acesso salvo. Tente novamente.' });
    }
  };
}

function isUnauthorized(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
}
