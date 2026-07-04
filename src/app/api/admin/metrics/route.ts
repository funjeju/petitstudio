import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';

// GET /api/admin/metrics — 투자용 지표/원가 로그 (인증 + 어드민). 07_ADMIN_DASHBOARD.md
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // 어드민 권한 확인: users/{uid}.role == 'admin'
  const snap = await adminDb().doc(`users/${auth.uid}`).get();
  if (snap.get('role') !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // TODO(Phase 5): costLogs 집계(월 누계/등급별/엔드포인트별) 반환.
  return NextResponse.json({ error: 'not implemented' }, { status: 501 });
}
