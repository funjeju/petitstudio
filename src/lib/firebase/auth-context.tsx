'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onIdTokenChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { getClientAuth, getGoogleProvider } from './client';

interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** 현재 유저의 ID 토큰(없으면 null). */
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onIdTokenChanged: 로그인/로그아웃 + 토큰 갱신 모두 반영. (브라우저에서만 초기화)
    const unsub = onIdTokenChanged(getClientAuth(), (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getToken = useCallback(async () => {
    const current = getClientAuth().currentUser;
    return current ? current.getIdToken() : null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(getClientAuth(), getGoogleProvider());
    // 최초 로그인 시 서버에서 users/{uid} 문서 부트스트랩(멱등).
    const token = await cred.user.getIdToken();
    await fetch('/api/me/bootstrap', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ locale: document?.documentElement?.lang || 'ko' }),
    }).catch(() => {
      /* 부트스트랩 실패는 조용히 무시 — 이후 재시도 경로 있음 */
    });
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(getClientAuth());
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, signInWithGoogle, signOut, getToken }),
    [user, loading, signInWithGoogle, signOut, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 <AuthProvider> 안에서만 사용');
  return ctx;
}
