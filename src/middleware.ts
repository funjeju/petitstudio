import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 내부 경로(_next), API, 정적 파일은 제외하고 로케일 라우팅 적용.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
