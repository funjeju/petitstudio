import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getUsage } from '@/lib/server/user';

// GET /api/me/usage — 내 사용량/크레딧 조회 (인증).
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const usage = await getUsage(auth.uid);
  if (!usage) {
    return NextResponse.json({ error: 'user not found (부트스트랩 필요)' }, { status: 404 });
  }
  return NextResponse.json(usage);
}
