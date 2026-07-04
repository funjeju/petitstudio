import 'server-only';

import { NextResponse } from 'next/server';
import { verifyIdToken, adminDb } from '@/lib/firebase/admin';

/** Authorization 헤더에서 Bearer 토큰 추출. */
export function getBearerToken(req: Request): string | undefined {
  const header = req.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : undefined;
}

/**
 * 인증 필수 라우트용 가드. 성공 시 { uid, token }, 실패 시 NextResponse(401).
 * 사용: const auth = await requireAuth(req); if (auth instanceof NextResponse) return auth;
 */
export async function requireAuth(req: Request) {
  const decoded = await verifyIdToken(getBearerToken(req));
  if (!decoded) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return { uid: decoded.uid, token: decoded };
}

/**
 * 어드민 전용 라우트 가드 — users/{uid}.role == 'admin' 서버 재검증(07 §1).
 * 성공 시 { uid, token }, 실패 시 401/403 NextResponse.
 */
export async function requireAdmin(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const snap = await adminDb().doc(`users/${auth.uid}`).get();
  if (snap.get('role') !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return auth;
}
