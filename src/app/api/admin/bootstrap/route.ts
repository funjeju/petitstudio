import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';

// POST /api/admin/bootstrap — ADMIN_EMAIL 과 일치하는 로그인 유저를 어드민으로 승격(멱등).
// 최초 어드민 계정 부트스트랩용. role 은 서버 전용 필드라 Admin SDK 로만 write.
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const email = auth.token.email?.trim().toLowerCase();
  if (!adminEmail || !email || email !== adminEmail) {
    return NextResponse.json({ error: 'not eligible' }, { status: 403 });
  }

  await adminDb().doc(`users/${auth.uid}`).set({ role: 'admin' }, { merge: true });
  return NextResponse.json({ ok: true, role: 'admin' });
}
