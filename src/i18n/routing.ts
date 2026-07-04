import { defineRouting } from 'next-intl/routing';
import { LOCALES, DEFAULT_LOCALE } from './locales';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // 기본 로케일도 URL 접두어(/ko, /en)를 갖도록 — SEO/공유 URL 명확화.
  localePrefix: 'always',
});
