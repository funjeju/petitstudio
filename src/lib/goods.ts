/**
 * 굿즈 카탈로그 — 05_COST_AND_TIERS.md §3 / goods-mockup 스킬.
 * MVP 는 코드 상수(어드민 CRUD 는 Phase 5). 판매가는 [가정], 인쇄단가는 [알 수 없음].
 */
import { QUALITY_USD_PORTRAIT, usdToKrw } from './pricing';

export type GoodsRatio = 'portrait' | 'square';

export interface GoodsDef {
  goodsId: string;
  nameKo: string;
  nameEn: string;
  requiredImages: number;
  priceKrw: number; // [가정]
  ratio: GoodsRatio;
  isCalendar: boolean;
}

export const GOODS: GoodsDef[] = [
  { goodsId: 'calendar_desk', nameKo: '탁상 달력', nameEn: 'Desk calendar', requiredImages: 12, priceKrw: 19000, ratio: 'portrait', isCalendar: true },
  { goodsId: 'calendar_wall', nameKo: '벽걸이 달력', nameEn: 'Wall calendar', requiredImages: 12, priceKrw: 22000, ratio: 'portrait', isCalendar: true },
  { goodsId: 'frame', nameKo: '액자', nameEn: 'Frame', requiredImages: 1, priceKrw: 18900, ratio: 'portrait', isCalendar: false },
  { goodsId: 'phonecase', nameKo: '폰케이스', nameEn: 'Phone case', requiredImages: 1, priceKrw: 15900, ratio: 'portrait', isCalendar: false },
];

export function getGoods(goodsId: string): GoodsDef | null {
  return GOODS.find((g) => g.goodsId === goodsId) ?? null;
}

/** 굿즈 이미지 생성원가(USD) = high 세로 × 필요 이미지 수. 인쇄단가는 별도 [알 수 없음]. */
export function goodsGenCostUsd(requiredImages: number): number {
  return QUALITY_USD_PORTRAIT.high * requiredImages;
}

/** 화면 표시용 원가 요약(원). printCost/margin 은 인쇄단가 확정 전 null. */
export function goodsCostSummary(goods: GoodsDef, usdKrw?: number) {
  const genCostUsd = goodsGenCostUsd(goods.requiredImages);
  return {
    genCostUsd,
    genCostKrw: usdToKrw(genCostUsd, usdKrw),
    priceKrw: goods.priceKrw,
    printCostKrw: null as number | null, // [알 수 없음]
    marginKrw: null as number | null, // 인쇄단가 확정 후
  };
}
