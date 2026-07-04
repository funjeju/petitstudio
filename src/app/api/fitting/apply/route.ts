import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { checkAndReserve, refundReservation } from '@/lib/server/cost-guardian';

// POST /api/fitting/apply — 어패럴/배경 합성(edit) (인증+크레딧+총액).
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const guard = await checkAndReserve({
    uid: auth.uid,
    endpoint: 'fitting.apply',
    quality: 'medium',
    edit: true, // 피팅룸은 참조 이미지 edit → EDIT_FACTOR 반영
  });
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: guard.status });
  }

  // TODO(Phase 2): 코어+어패럴 프롬프트 조각으로 edit 실행 → commitCost().
  await refundReservation(auth.uid, guard.reserved.period);
  return NextResponse.json({ error: 'not implemented (Phase 2)' }, { status: 501 });
}
