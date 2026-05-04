import { SECURE_ACCESS_TOKEN_KEY } from '@/constants/storage';
import { appAuthLogin, appAuthRegister, fetchAppMe } from '@/lib/api/app-auth';
import { setAccessToken, setOnUnauthorized } from '@/lib/api';
import type { AppUserMe } from '@/lib/api/types/app-auth.types';
import {
  deleteStoredToken,
  getStoredToken,
  setStoredToken,
} from '@/lib/storage/token-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const shouldBypassAuth =
  process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true' ||
  process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === '1';

type AuthContextValue = {
  isLoggedIn: boolean;
  isReady: boolean;
  user: AppUserMe | null;
  signIn: (accessToken: string) => void;
  signInWithCredentials: (email: string, password: string) => Promise<AppUserMe>;
  signUp: (
    email: string,
    password: string,
    passwordConfirm: string,
    displayName: string,
  ) => Promise<AppUserMe>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistAndApplySession(
  token: string,
  setUser: (u: AppUserMe | null) => void,
  setIsLoggedIn: (v: boolean) => void,
): Promise<AppUserMe> {
  await setStoredToken(SECURE_ACCESS_TOKEN_KEY, token);
  setAccessToken(token);
  const me = await fetchAppMe();
  setUser(me);
  setIsLoggedIn(true);
  return me;
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState(shouldBypassAuth);
  const [isReady, setIsReady] = useState(shouldBypassAuth);
  const [user, setUser] = useState<AppUserMe | null>(null);

  useEffect(() => {
    setOnUnauthorized(() => {
      setAccessToken(null);
      setUser(null);
      setIsLoggedIn(false);
      void deleteStoredToken(SECURE_ACCESS_TOKEN_KEY);
    });
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    if (shouldBypassAuth) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getStoredToken(SECURE_ACCESS_TOKEN_KEY);
        if (cancelled) {
          return;
        }
        if (!token) {
          return;
        }
        setAccessToken(token);
        const me = await fetchAppMe();
        if (cancelled) {
          return;
        }
        setUser(me);
        setIsLoggedIn(true);
      } catch {
        setAccessToken(null);
        setUser(null);
        await deleteStoredToken(SECURE_ACCESS_TOKEN_KEY);
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((token: string) => {
    setAccessToken(token);
    setIsLoggedIn(true);
  }, []);

  const signInWithCredentials = useCallback(
    async (email: string, password: string) => {
      const { accessToken } = await appAuthLogin(email, password);
      return persistAndApplySession(accessToken, setUser, setIsLoggedIn);
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      passwordConfirm: string,
      displayName: string,
    ) => {
      const { accessToken } = await appAuthRegister({
        email,
        password,
        passwordConfirm,
        displayName,
      });
      return persistAndApplySession(accessToken, setUser, setIsLoggedIn);
    },
    [],
  );

  const signOut = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    setIsLoggedIn(false);
    await deleteStoredToken(SECURE_ACCESS_TOKEN_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isLoggedIn || shouldBypassAuth) {
      return;
    }
    const me = await fetchAppMe();
    setUser(me);
  }, [isLoggedIn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      isReady,
      user,
      signIn,
      signInWithCredentials,
      signUp,
      signOut,
      refreshUser,
    }),
    [
      isLoggedIn,
      isReady,
      user,
      signIn,
      signInWithCredentials,
      signUp,
      signOut,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
