import 'server-only';

import { adminDb } from '@/lib/firebase/admin';
import { DEFAULTS } from '@/lib/pricing';
import { DEFAULT_TIER_LIMITS } from '@/lib/tiers';
import type { AdminConfigDoc } from '@/lib/types';

/**
 * adminConfig/global 을 읽어 런타임 설정 반환. 문서가 없으면 코드 기본값으로 폴백.
 * MONTHLY_COST_CAP_USD 는 env 우선(운영 중 빠른 kill switch 조정용).
 */
export async function getAdminConfig(): Promise<AdminConfigDoc> {
  const envCap = Number(process.env.MONTHLY_COST_CAP_USD);
  const fallback: AdminConfigDoc = {
    defaultQuality: 'medium',
    monthlyCostCapUsd: Number.isFinite(envCap) && envCap > 0 ? envCap : DEFAULTS.MONTHLY_COST_CAP_USD,
    tierLimits: { ...DEFAULT_TIER_LIMITS },
    usdKrw: DEFAULTS.USD_KRW,
  };

  try {
    const snap = await adminDb().doc('adminConfig/global').get();
    if (!snap.exists) return fallback;
    const data = snap.data() as Partial<AdminConfigDoc>;
    return {
      defaultQuality: data.defaultQuality ?? fallback.defaultQuality,
      // env 로 지정됐으면 env 가 최종(긴급 차단), 아니면 문서값.
      monthlyCostCapUsd:
        Number.isFinite(envCap) && envCap > 0
          ? envCap
          : data.monthlyCostCapUsd ?? fallback.monthlyCostCapUsd,
      tierLimits: { ...fallback.tierLimits, ...(data.tierLimits ?? {}) },
      usdKrw: data.usdKrw ?? fallback.usdKrw,
    };
  } catch {
    return fallback;
  }
}
