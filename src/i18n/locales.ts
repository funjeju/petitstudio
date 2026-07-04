/**
 * 18개 지원 언어 [가정] — README §핵심 미해결 #5(타깃시장 우선순위 확정 후 조정).
 * 값은 data model users.locale 과 동기화. 순서 = UI 언어 선택기 노출 순.
 */
export const LOCALES = [
  'ko', // 한국어
  'en', // English
  'ja', // 日本語
  'zh', // 简体中文
  'zh-TW', // 繁體中文
  'es', // Español
  'pt', // Português
  'fr', // Français
  'de', // Deutsch
  'it', // Italiano
  'ru', // Русский
  'id', // Bahasa Indonesia
  'th', // ไทย
  'vi', // Tiếng Việt
  'hi', // हिन्दी
  'ar', // العربية (RTL)
  'tr', // Türkçe
  'nl', // Nederlands
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';

/** RTL 언어 — <html dir> 결정용. */
export const RTL_LOCALES: readonly Locale[] = ['ar'];

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '简体中文',
  'zh-TW': '繁體中文',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ru: 'Русский',
  id: 'Bahasa Indonesia',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  hi: 'हिन्दी',
  ar: 'العربية',
  tr: 'Türkçe',
  nl: 'Nederlands',
};

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

/** 지원 로케일 여부 타입가드 (next-intl 3.x — hasLocale 대체). */
export function isSupportedLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
