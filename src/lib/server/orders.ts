import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

/** 주문 생성(서버 전용 — 보안규칙상 orders write 는 클라이언트 금지). 03 §2 orders. */
export async function createOrder(input: {
  ownerUid: string;
  goodsId: string;
  genIds: string[];
  amountKrw: number;
  genCostUsd: number;
}): Promise<string> {
  const ref = adminDb().collection('orders').doc();
  await ref.set({
    orderId: ref.id,
    ownerUid: input.ownerUid,
    goodsId: input.goodsId,
    genIds: input.genIds,
    amountKrw: input.amountKrw,
    genCostUsd: input.genCostUsd,
    printCostKrw: null, // [알 수 없음] 인쇄 제휴 단가 미정
    status: 'cart', // 결제/인쇄는 제휴 확정 후 (Phase 4는 목업)
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
