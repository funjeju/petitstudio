/**
 * cost-calculator 스킬 포팅 — 05_COST_AND_TIERS.md / skills/cost-calculator.md.
 * 순수 함수/상수만(서버·클라이언트 공용). 실제 과금 판단은 server/cost-guardian 이 담당.
 *
 * [확정] 단가(1024×1024, USD) / [가정] 환율·edit 계수는 파일럿으로 교체.
 */
import type { Quality } from './types';

/** 정방형(1024×1024) 품질별 USD 단가 [확정]. */
export const QUALITY_USD: Record<Quality, number> = {
  low: 0.006,
  medium: 0.053,
  high: 0.211,
};

/** 세로형(1024×1536) 단가 — 굿즈 인쇄용(더 저렴). */
export const QUALITY_USD_PORTRAIT: Record<Quality, number> = {
  low: 0.005,
  medium: 0.041,
  high: 0.165,
};

/** [가정] 실운영 전 교체. adminConfig 로 override 가능. */
export const DEFAULTS = {
  USD_KRW: 1450,
  EDIT_FACTOR: 1.8, // 피팅룸 edit 보정계수(참조이미지+재시도), 파일럿 실측 필요
  MARGIN_TARGET: 0.75,
  MONTHLY_COST_CAP_USD: 500,
} as const;

/**
 * 한 번의 생성 요청 추정 원가(USD).
 * edit(피팅룸/합성)면 EDIT_FACTOR 적용. portrait면 세로형 단가 사용.
 */
export function estimateCostUsd(opts: {
  quality: Quality;
  edit?: boolean;
  portrait?: boolean;
  editFactor?: number;
}): number {
  const table = opts.portrait ? QUALITY_USD_PORTRAIT : QUALITY_USD;
  const base = table[opts.quality];
  const factor = opts.edit ? opts.editFactor ?? DEFAULTS.EDIT_FACTOR : 1;
  return base * factor;
}

export function usdToKrw(usd: number, usdKrw: number = DEFAULTS.USD_KRW): number {
  return Math.round(usd * usdKrw);
}

/** 굿즈 이미지 생성원가(세로 high × 장수). 인쇄 제휴원가는 [알 수 없음] 별도. */
export function goodsGenCostUsd(requiredImages: number): number {
  return QUALITY_USD_PORTRAIT.high * requiredImages;
}

/**
 * 정산 주기 키 'YYYY-MM'. credits.period / costLogs.period / costTotals 문서 ID.
 * UTC 기준으로 통일(서버·클라이언트 일관성).
 */
export function currentPeriod(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}
