import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { createOrder } from '@/lib/server/orders';
import { parseJson } from '@/lib/server/generation';
import { getGoods, goodsGenCostUsd } from '@/lib/goods';
import { adminDb } from '@/lib/firebase/admin';
import type { GenerationDoc } from '@/lib/types';

// POST /api/goods/order — 굿즈 주문 담기(cart). 결제/인쇄는 제휴 확정 후. 05 §3
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseJson<{ goodsId?: string; genIds?: string[] }>(req);
  const goods = body.goodsId ? getGoods(body.goodsId) : null;
  if (!goods) return NextResponse.json({ error: 'unknown goodsId' }, { status: 400 });

  const genIds = body.genIds ?? [];
  if (genIds.length === 0) return NextResponse.json({ error: 'genIds 필요' }, { status: 400 });

  // 선택 생성물 소유권 확인.
  const snaps = await adminDb().getAll(...genIds.map((id) => adminDb().doc(`generations/${id}`)));
  for (const s of snaps) {
    if (!s.exists) return NextResponse.json({ error: 'generation not found' }, { status: 404 });
    if ((s.data() as GenerationDoc).ownerUid !== auth.uid) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  // 굿즈 확정 시 필요 이미지 전량을 high 로 재생성한다는 전제의 생성원가(05 §3).
  const genCostUsd = goodsGenCostUsd(goods.requiredImages);
  const orderId = await createOrder({
    ownerUid: auth.uid,
    goodsId: goods.goodsId,
    genIds,
    amountKrw: goods.priceKrw,
    genCostUsd,
  });

  return NextResponse.json({ orderId, amountKrw: goods.priceKrw, genCostUsd, status: 'cart' });
}
