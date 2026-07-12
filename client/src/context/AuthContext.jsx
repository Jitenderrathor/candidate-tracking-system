import { useCallback, useEffect, useMemo, useState } from 'react';
import { AUTH_LOGOUT_EVENT } from '@/constants/auth';
import { AuthContext } from '@/context/AuthContextDefinition';
import { authStorage } from '@/utils/authStorage';
import { decodeJwt, isTokenExpired } from '@/utils/jwt';

const sessionFromToken = (token) => {
  const payload = token ? decodeJwt(token) : null;
  if (!payload || isTokenExpired(payload)) return null;
  return {
    token,
    user: { id: payload.sub, role: payload.role },
    expiresAt: payload.exp * 1000,
  };
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const storedToken = authStorage.getToken();
    const storedSession = sessionFromToken(storedToken);
    if (!storedSession && storedToken) authStorage.clear();
    return storedSession;
  });

  const logout = useCallback(() => {
    authStorage.clear();
    setSession(null);
  }, []);

  const login = useCallback((token) => {
    const nextSession = sessionFromToken(token);
    if (!nextSession) throw new Error('The authentication token is invalid or expired');
    authStorage.setToken(token);
    setSession(nextSession);
  }, []);

  useEffect(() => {
    window.addEventListener(AUTH_LOGOUT_EVENT, logout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, logout);
  }, [logout]);

  useEffect(() => {
    if (!session?.expiresAt) return undefined;
    const remainingTime = session.expiresAt - Date.now();
    if (remainingTime <= 0) {
      logout();
      return undefined;
    }
    const timer = window.setTimeout(logout, remainingTime);
    return () => window.clearTimeout(timer);
  }, [logout, session?.expiresAt]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session),
      login,
      logout,
      token: session?.token ?? null,
      user: session?.user ?? null,
    }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
