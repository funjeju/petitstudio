import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';

// POST /api/image/delete — 소프트 삭제(휴지통) (인증). 03_DATA_MODEL.md §4
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // TODO(Phase 2): 소유권 확인 후 status:'trashed' + Storage trash/ 이동. 하드 삭제 금지.
  return NextResponse.json({ error: 'not implemented' }, { status: 501 });
}
