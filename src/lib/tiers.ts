/**
 * 등급 정책 — 05_COST_AND_TIERS.md §2 "안 B(마진 우선안, 권장 시작점)" [가정].
 * 월 생성 한도의 최종 소스는 adminConfig/global.tierLimits(어드민 조정).
 * 여기 값은 adminConfig 미존재 시 폴백 기본값.
 */
import type { Tier } from './types';

/** 안 B 월 생성 한도(폴백 기본값). */
export const DEFAULT_TIER_LIMITS: Record<Tier, number> = {
  free: 5,
  pro: 20,
  vip: 50,
};

/** 비회원 1회 체험 장수(로그인 없이). */
export const GUEST_TRIAL_QUOTA = 2;

/** 구독료(원) — [가정] 안 B. */
export const TIER_PRICE_KRW: Record<Tier, number> = {
  free: 0,
  pro: 12900,
  vip: 29900,
};

export const DEFAULT_TIER: Tier = 'free';
