import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { isRtl, isSupportedLocale } from '@/i18n/locales';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { AppShell } from '@/components/app-shell';
import '../globals.css';

export const metadata: Metadata = {
  title: 'petit studio',
  description: '반려동물 AI 스튜디오 · 가상 피팅룸 · 굿즈',
};

// 지원 로케일을 정적 생성.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  // 정적 렌더링 활성화(next-intl).
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={isRtl(locale) ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
