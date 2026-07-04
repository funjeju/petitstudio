import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { isSupportedLocale } from './locales';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isSupportedLocale(requested) ? requested : routing.defaultLocale;

  // 미번역 언어는 영어로 폴백 로드(점진적 번역 전략). ko/en 은 실제 파일 존재.
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../messages/en.json`)).default;
  }

  return { locale, messages };
});
