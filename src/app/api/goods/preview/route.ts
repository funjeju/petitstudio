import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { checkAndReserve, refundReservation } from '@/lib/server/cost-guardian';

// POST /api/goods/preview — 굿즈용 고해상(high 세로) 생성 (인증+크레딧+총액).
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const guard = await checkAndReserve({
    uid: auth.uid,
    endpoint: 'goods.preview',
    quality: 'high',
    portrait: true, // 굿즈는 세로형이 저렴(05 §1)
  });
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: guard.status });
  }

  // TODO(Phase 4): 굿즈 미리보기용 고해상 생성 + 원가 계산 연동 → commitCost().
  await refundReservation(auth.uid, guard.reserved.period);
  return NextResponse.json({ error: 'not implemented (Phase 4)' }, { status: 501 });
}
