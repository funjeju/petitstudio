import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { ensureUserDoc } from '@/lib/server/user';
import { isSupportedLocale } from '@/i18n/locales';

// POST /api/me/bootstrap — 최초 로그인 후 users/{uid} 문서 생성(멱등) 후 사용량 반환.
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // 클라이언트가 초기 로케일 힌트를 보낼 수 있음(검증 후 사용).
  let locale = 'ko';
  try {
    const body = (await req.json()) as { locale?: string };
    if (isSupportedLocale(body?.locale)) locale = body.locale;
  } catch {
    /* body 없음 허용 */
  }

  const usage = await ensureUserDoc(auth.token, locale);
  return NextResponse.json(usage);
}
