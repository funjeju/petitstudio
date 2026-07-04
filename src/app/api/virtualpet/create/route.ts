import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { checkAndReserve, refundReservation } from '@/lib/server/cost-guardian';

// POST /api/virtualpet/create — 가상 펫 생성 (인증+크레딧+총액).
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const guard = await checkAndReserve({
    uid: auth.uid,
    endpoint: 'virtualpet.create',
    quality: 'medium',
    edit: true,
  });
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: guard.status });
  }

  // TODO(Phase 2): 가상 펫 합성 레시피 → 생성 → commitCost().
  await refundReservation(auth.uid, guard.reserved.period);
  return NextResponse.json({ error: 'not implemented (Phase 2)' }, { status: 501 });
}
