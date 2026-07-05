'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from './theme-toggle';
import { AuthButton } from './auth-button';
import { NavIcon } from './icons';

/**
 * 반응형 셸 — DESIGN.md §5:
 *  · 모바일: 하단 5탭바 (홈/탐색/[중앙 카메라 FAB]/컬렉션/마이 스튜디오)
 *  · 웹(lg+): 좌측 사이드바 + 넓은 컨테이너
 */

type NavKey = 'home' | 'explore' | 'fitting' | 'create' | 'collection' | 'studio';
type IconName = 'home' | 'explore' | 'apparel' | 'create' | 'collection' | 'studio';
type NavItem = { key: NavKey; href: string; icon: IconName; match: string };

// 웹 사이드바(촬영은 상단 버튼이라 목록 제외, 피팅룸 포함).
const SIDEBAR_NAV: NavItem[] = [
  { key: 'home', href: '/', icon: 'home', match: '/' },
  { key: 'explore', href: '/explore', icon: 'explore', match: '/explore' },
  { key: 'fitting', href: '/fitting/new', icon: 'apparel', match: '/fitting' },
  { key: 'collection', href: '/collection', icon: 'collection', match: '/collection' },
  { key: 'studio', href: '/studio', icon: 'studio', match: '/studio' },
];

// 모바일 하단 5탭(중앙 촬영 FAB).
const BOTTOM_NAV: NavItem[] = [
  { key: 'home', href: '/', icon: 'home', match: '/' },
  { key: 'explore', href: '/explore', icon: 'explore', match: '/explore' },
  { key: 'create', href: '/create', icon: 'create', match: '/create' },
  { key: 'collection', href: '/collection', icon: 'collection', match: '/collection' },
  { key: 'studio', href: '/studio', icon: 'studio', match: '/studio' },
];

function useActive() {
  const pathname = usePathname();
  return (match: string) => (match === '/' ? pathname === '/' : pathname.startsWith(match));
}

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const isActive = useActive();

  return (
    <div className="min-h-dvh lg:flex">
      {/* 웹 사이드바 */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r px-4 py-6 lg:flex">
        <Link href="/" className="px-2 text-lg font-bold tracking-tight">
          petit<span className="text-text-muted"> studio</span>
        </Link>

        <Link
          href="/create"
          className="mt-6 flex items-center justify-center gap-2 rounded-control bg-accent px-3 py-2.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          <NavIcon name="create" width={18} height={18} />
          {t('create')}
        </Link>

        <nav className="mt-6 flex flex-col gap-1">
          {SIDEBAR_NAV.map((item) => {
            const active = isActive(item.match);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-surface font-medium text-text-primary'
                    : 'text-text-secondary hover:bg-surface/60 hover:text-text-primary'
                }`}
              >
                <NavIcon name={item.icon} />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t pt-4">
          <AuthButton />
          <ThemeToggle />
        </div>
      </aside>

      {/* 본문 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 모바일 상단바 */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-bg/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="text-base font-bold tracking-tight">
            petit<span className="text-text-muted"> studio</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <div className="max-w-[8rem]">
              <AuthButton />
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-bg/95 backdrop-blur lg:hidden">
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item.match);
          const isCreate = item.key === 'create';
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 py-2"
            >
              {isCreate ? (
                <span className="-mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-md ring-4 ring-bg">
                  <NavIcon name="create" width={22} height={22} />
                </span>
              ) : (
                <>
                  <NavIcon
                    name={item.icon}
                    className={active ? 'text-text-primary' : 'text-text-muted'}
                  />
                  <span className={`text-[10px] ${active ? 'text-text-primary' : 'text-text-muted'}`}>
                    {t(item.key)}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
