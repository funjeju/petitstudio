import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';
import { getAdminConfig } from './config';
import { currentPeriod } from '@/lib/pricing';
import { DEFAULT_TIER } from '@/lib/tiers';
import type { Credits, Tier } from '@/lib/types';

export interface UsageView {
  tier: Tier;
  role: 'user' | 'admin';
  credits: Credits;
  remaining: number;
}

/**
 * 최초 로그인 시 users/{uid} 문서를 기본값으로 생성(멱등).
 * tier/role/credits 는 서버 전용 필드 — 반드시 Admin SDK 경유(보안규칙이 클라이언트 write 차단).
 */
export async function ensureUserDoc(token: DecodedIdToken, locale = 'ko'): Promise<UsageView> {
  const db = adminDb();
  const ref = db.doc(`users/${token.uid}`);
  const cfg = await getAdminConfig();
  const period = currentPeriod();

  const snap = await ref.get();
  if (!snap.exists) {
    const credits: Credits = {
      period,
      limit: cfg.tierLimits[DEFAULT_TIER],
      used: 0,
      trialUsed: false,
    };
    await ref.set({
      uid: token.uid,
      email: token.email ?? '',
      displayName: token.name ?? '',
      photoURL: token.picture ?? '',
      tier: DEFAULT_TIER,
      role: 'user',
      locale,
      theme: 'system',
      credits,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { tier: DEFAULT_TIER, role: 'user', credits, remaining: credits.limit };
  }

  return normalizeUsage(snap.data() as Record<string, unknown>, cfg.tierLimits, period);
}

/** 저장된 유저 문서를 표시용 사용량으로 정규화(주기 경과 시 리셋값을 계산만, write 안 함). */
function normalizeUsage(
  data: Record<string, unknown>,
  tierLimits: Record<Tier, number>,
  period: string,
): UsageView {
  const tier = (data.tier as Tier) ?? DEFAULT_TIER;
  const role = (data.role as 'user' | 'admin') ?? 'user';
  const stored = data.credits as Credits | undefined;

  let credits: Credits;
  if (!stored || stored.period !== period) {
    credits = { period, limit: tierLimits[tier] ?? tierLimits[DEFAULT_TIER], used: 0, trialUsed: stored?.trialUsed ?? false };
  } else {
    credits = stored;
  }
  return { tier, role, credits, remaining: Math.max(0, credits.limit - credits.used) };
}

/** 내 사용량 조회(읽기 전용). 문서 없으면 null. */
export async function getUsage(uid: string): Promise<UsageView | null> {
  const cfg = await getAdminConfig();
  const snap = await adminDb().doc(`users/${uid}`).get();
  if (!snap.exists) return null;
  return normalizeUsage(snap.data() as Record<string, unknown>, cfg.tierLimits, currentPeriod());
}
