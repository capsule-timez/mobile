import { createContext, useContext, useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { authApi } from '../services/auth';
import { configureHttpAuth } from '../services/http';
import { Session, type User } from './session';
import { tokenStorage } from './storage';

const AuthContext = createContext<Session | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session] = useState(() => new Session(tokenStorage, authApi));
  useEffect(() => {
    configureHttpAuth(session.getToken, session.invalidate);
    void session.restore();
    return () => configureHttpAuth(() => null, async () => {});
  }, [session]);
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const session = useContext(AuthContext);
  if (!session) throw new Error('useAuth precisa de AuthProvider.');
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  return { state, authenticate: session.authenticate, signOut: session.signOut, restore: session.restore };
}

/** Usuário autenticado. Só pode ser usado em telas protegidas (`Stack.Protected`). */
export function useUser(): User | null {
  const { state } = useAuth();
  return state.status === 'signedIn' ? state.user : null;
}
