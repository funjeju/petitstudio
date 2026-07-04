'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from './theme-toggle';
import { AuthButton } from './auth-button';

/**
 * 반응형 셸 — DESIGN.md §5:
 *  · 모바일: 하단 5탭바 (홈/탐색/[중앙 카메라 FAB]/컬렉션/마이 스튜디오)
 *  · 웹(lg+): 좌측 사이드바 + 넓은 컨테이너
 */

type NavItem = { key: 'home' | 'explore' | 'create' | 'collection' | 'studio'; href: string };

const NAV: NavItem[] = [
  { key: 'home', href: '/' },
  { key: 'explore', href: '/explore' },
  { key: 'create', href: '/create' },
  { key: 'collection', href: '/collection' },
  { key: 'studio', href: '/studio' },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
}

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const isActive = useActive();

  return (
    <div className="min-h-dvh lg:flex">
      {/* 웹 사이드바 */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r px-4 py-6 lg:flex">
        <div className="px-2 text-lg font-bold tracking-tight">petit studio</div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-control px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? 'bg-surface font-medium text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-1">
          <AuthButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* 본문 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 모바일 상단바 */}
        <header className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
          <span className="text-base font-bold tracking-tight">petit studio</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="max-w-[9rem]">
              <AuthButton />
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 lg:pb-10">
          {children}
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-bg/95 backdrop-blur lg:hidden">
        {NAV.map((item) => {
          const active = isActive(item.href);
          const isCreate = item.key === 'create';
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-2"
              aria-current={active ? 'page' : undefined}
            >
              {isCreate ? (
                // 중앙 원형 카메라 FAB(반쯤 떠 있는 강조).
                <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-sm">
                  ＋
                </span>
              ) : (
                <span
                  className={`text-[11px] ${active ? 'text-text-primary' : 'text-text-muted'}`}
                >
                  {t(item.key)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
