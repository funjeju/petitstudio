'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/firebase/auth-context';

/** 로그인/로그아웃 버튼 + 로그인 상태 표시. 셸 하단/헤더에 배치. */
export function AuthButton() {
  const t = useTranslations('auth');
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <div className="h-8 w-full animate-pulse rounded-control bg-surface" aria-hidden />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="w-full rounded-control bg-accent px-3 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
      >
        {t('signInWithGoogle')}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs">
          {(user.displayName ?? user.email ?? '?').slice(0, 1)}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
        {user.displayName ?? user.email}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-[6px] px-2 py-1 text-xs text-text-muted hover:text-text-primary"
      >
        {t('signOut')}
      </button>
    </div>
  );
}
