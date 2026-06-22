import { SECURE_ACCESS_TOKEN_KEY } from '@/constants/storage';
import { appAuthLogin, appAuthRegister, fetchAppMe } from '@/lib/api/app-auth';
import { setAccessToken, setOnUnauthorized } from '@/lib/api';
import type { AppUserMe } from '@/lib/api/types/app-auth.types';
import {
  deleteStoredToken,
  getStoredToken,
  getStoredTokenSync,
  setStoredToken,
} from '@/lib/storage/token-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  refreshUser: () => Promise<AppUserMe | null>;
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
  const hydratedTokenRef = useRef(false);

  if (!hydratedTokenRef.current && !shouldBypassAuth) {
    hydratedTokenRef.current = true;
    const token = getStoredTokenSync(SECURE_ACCESS_TOKEN_KEY);
    if (token) {
      setAccessToken(token);
    }
  }

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
    const tokenTimeoutMs = 6000;

    async function safeGetStoredToken(): Promise<string | null> {
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(resolve, tokenTimeoutMs, null);
      });
      try {
        return await Promise.race([getStoredToken(SECURE_ACCESS_TOKEN_KEY), timeoutPromise]);
      } catch {
        return null;
      }
    }

    (async () => {
      try {
        const token = await safeGetStoredToken();
        if (cancelled) {
          return;
        }
        if (!token) {
          return;
        }
        setAccessToken(token);
        const mePromise = fetchAppMe();
        const meTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('fetchAppMe timeout')), tokenTimeoutMs);
        });
        const me = await Promise.race([mePromise, meTimeoutPromise]).catch(() => null);
        if (cancelled) {
          return;
        }
        if (me != null) {
          setUser(me);
          setIsLoggedIn(true);
        } else {
          setAccessToken(null);
          setUser(null);
          await deleteStoredToken(SECURE_ACCESS_TOKEN_KEY);
        }
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

  const refreshUser = useCallback(async (): Promise<AppUserMe | null> => {
    if (!isLoggedIn || shouldBypassAuth) {
      return null;
    }
    const me = await fetchAppMe();
    setUser(me);
    return me;
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
