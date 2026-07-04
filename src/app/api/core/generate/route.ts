import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { checkAndReserve, refundReservation } from '@/lib/server/cost-guardian';

// POST /api/core/generate — 코어 이미지 생성 (인증+크레딧+총액). 02_ARCHITECTURE.md §4
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const guard = await checkAndReserve({ uid: auth.uid, endpoint: 'core.generate', quality: 'medium' });
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: guard.status });
  }

  // TODO(Phase 2): GPT Image 2 호출 → Storage 저장 → coreImages 기록 → commitCost().
  // 실제 생성이 아직 없으므로 선차감한 크레딧을 되돌리고 501 반환(크레딧 유실 방지).
  await refundReservation(auth.uid, guard.reserved.period);
  return NextResponse.json({ error: 'not implemented (Phase 2)' }, { status: 501 });
}
