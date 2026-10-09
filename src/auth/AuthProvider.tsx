import { createContext, useContext, useEffect, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { authApi } from '../services/auth';
import { configureHttpAuth } from '../services/http';
import { Session } from './session';
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
