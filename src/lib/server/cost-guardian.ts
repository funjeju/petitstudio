import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getAdminConfig } from './config';
import { currentPeriod, estimateCostUsd } from '@/lib/pricing';
import { DEFAULT_TIER } from '@/lib/tiers';
import type { Credits, Quality, Tier } from '@/lib/types';

/**
 * cost-guardian — 돈이 나가는 모든 경로의 사전 검사(ORCHESTRATOR §5, 05 문서 §4).
 * 흐름:
 *   checkAndReserve() → (성공) 크레딧 1 선차감 + kill switch 검사  [생성 전]
 *   commitCost()      → costLogs 기록 + 월 총액(costTotals) 누계   [생성 성공 후]
 *   refundReservation() → 선차감 롤백                             [생성 실패 시]
 *
 * 선차감/환불 패턴: OpenAI 호출 전에 크레딧을 잡고, 실패하면 되돌려 유실 방지.
 */

export type GuardResult =
  | { ok: true; reserved: { period: string; remaining: number } }
  | { ok: false; status: number; reason: string };

export interface GuardInput {
  uid: string;
  endpoint: string; // 'core.generate' | 'fitting.apply' | 'virtualpet.create' | 'goods.preview'
  quality: Quality;
  edit?: boolean; // 피팅룸/합성이면 true (EDIT_FACTOR 반영)
  portrait?: boolean; // 굿즈 세로형이면 true
}

function resetCreditsForPeriod(tier: Tier, tierLimits: Record<Tier, number>, period: string, trialUsed: boolean): Credits {
  return {
    period,
    limit: tierLimits[tier] ?? tierLimits[DEFAULT_TIER],
    used: 0,
    trialUsed,
  };
}

/**
 * 등급·잔여 크레딧 검사 후 성공 시 1건 선차감(트랜잭션). 월 총액 상한도 확인.
 */
export async function checkAndReserve(input: GuardInput): Promise<GuardResult> {
  const db = adminDb();
  const period = currentPeriod();
  const cfg = await getAdminConfig();

  const userRef = db.doc(`users/${input.uid}`);
  const totalRef = db.doc(`costTotals/${period}`);

  try {
    return await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        return { ok: false as const, status: 404, reason: 'user not found (부트스트랩 필요)' };
      }

      const user = userSnap.data() as { tier?: Tier; role?: string; credits?: Credits };
      const tier = user.tier ?? DEFAULT_TIER;
      const isAdmin = user.role === 'admin';
      let credits = user.credits;

      // 주기 경과 시 이번 달 한도로 리셋.
      if (!credits || credits.period !== period) {
        credits = resetCreditsForPeriod(tier, cfg.tierLimits, period, credits?.trialUsed ?? false);
      }

      // 잔량 검사 — 어드민은 크레딧 제한 없음(차감/검사 스킵).
      if (!isAdmin && credits.used >= credits.limit) {
        return { ok: false as const, status: 402, reason: 'quota exceeded (크레딧 소진)' };
      }

      // 월 총액 kill switch — 전역 안전장치라 어드민 포함 유지.
      const totalSnap = await tx.get(totalRef);
      const totalUsd = (totalSnap.exists ? (totalSnap.get('costUsd') as number) : 0) ?? 0;
      if (totalUsd >= cfg.monthlyCostCapUsd) {
        return { ok: false as const, status: 503, reason: 'monthly cost cap reached (kill switch)' };
      }

      if (isAdmin) {
        // 크레딧 미차감. (Number.MAX_SAFE_INTEGER 로 '무제한' 표시)
        return { ok: true as const, reserved: { period, remaining: Number.MAX_SAFE_INTEGER } };
      }

      // 선차감(예약).
      const nextUsed = credits.used + 1;
      tx.set(userRef, { credits: { ...credits, used: nextUsed } }, { merge: true });

      return {
        ok: true as const,
        reserved: { period, remaining: credits.limit - nextUsed },
      };
    });
  } catch (err) {
    // 트랜잭션/Firestore 오류 시 안전하게 차단.
    return { ok: false, status: 503, reason: `guard error: ${(err as Error).message}` };
  }
}

/** 생성 실패 시 선차감 롤백(used -1, 0 미만 방지). */
export async function refundReservation(uid: string, period = currentPeriod()): Promise<void> {
  const db = adminDb();
  const userRef = db.doc(`users/${uid}`);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) return;
      if (snap.get('role') === 'admin') return; // 어드민은 미차감 → 환불 불필요
      const credits = snap.get('credits') as Credits | undefined;
      if (!credits || credits.period !== period) return; // 주기 바뀌었으면 롤백 불필요
      const used = Math.max(0, credits.used - 1);
      tx.set(userRef, { credits: { ...credits, used } }, { merge: true });
    });
  } catch {
    // 환불 실패는 사용자 불이익 → 로깅 대상(추후 관측성). 여기선 조용히 무시.
  }
}

/**
 * 생성 성공 후 실제 원가 기록 + 월 총액 누계. costLogs 는 서버만 write(보안규칙).
 */
export async function commitCost(input: GuardInput & { period?: string; costUsd?: number }): Promise<number> {
  const db = adminDb();
  const period = input.period ?? currentPeriod();
  const costUsd =
    input.costUsd ?? estimateCostUsd({ quality: input.quality, edit: input.edit, portrait: input.portrait });

  const batch = db.batch();
  const logRef = db.collection('costLogs').doc();
  batch.set(logRef, {
    logId: logRef.id,
    uid: input.uid,
    endpoint: input.endpoint,
    model: 'gpt-image-2-2026-04-21',
    quality: input.quality,
    costUsd,
    period,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 월 총액 누계(kill switch 기준). 원자적 증가.
  const totalRef = db.doc(`costTotals/${period}`);
  batch.set(
    totalRef,
    { period, costUsd: FieldValue.increment(costUsd), count: FieldValue.increment(1) },
    { merge: true },
  );

  await batch.commit();
  return costUsd;
}
