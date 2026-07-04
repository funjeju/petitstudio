/**
 * Firestore 데이터 모델 타입 — 03_DATA_MODEL.md 와 1:1 대응.
 * 스키마 변경 시 문서와 이 파일을 함께 갱신(firestore-schema-guard).
 */
import type { Timestamp } from 'firebase/firestore';

export type Tier = 'free' | 'pro' | 'vip';
export type Role = 'user' | 'admin';
export type ThemePref = 'light' | 'dark' | 'system';
export type Quality = 'low' | 'medium' | 'high';
export type AssetStatus = 'active' | 'trashed';
export type Species = 'dog' | 'cat' | 'other' | 'virtual';
export type GenerationType = 'fitting' | 'virtualpet' | 'goods';
export type ApparelCategory = 'hat' | 'outfit' | 'accessory' | 'season' | 'prop';
export type OrderStatus = 'cart' | 'paid' | 'printing' | 'shipped';

/** 다국어 이름 맵(부분 번역 허용). */
export type I18nText = Partial<Record<string, string>> & { ko?: string; en?: string };

export interface Credits {
  period: string; // YYYY-MM
  limit: number;
  used: number;
  trialUsed: boolean;
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  tier: Tier; // 서버만 write
  locale: string;
  theme: ThemePref;
  createdAt: Timestamp;
  role: Role; // 서버만 write
  credits: Credits; // 서버만 write
}

export interface PetDoc {
  petId: string;
  ownerUid: string;
  name: string;
  species: Species;
  breed: string;
  birthday: Timestamp | null;
  adoptedAt: Timestamp | null;
  isVirtual: boolean;
  virtualRecipe: unknown | null;
  createdAt: Timestamp;
}

export interface CoreImageDoc {
  coreId: string;
  ownerUid: string;
  petId: string;
  storagePath: string;
  imageUrl: string; // 다운로드 토큰 URL(표시용, 03 §2)
  quality: Quality;
  costUsd: number;
  status: AssetStatus;
  createdAt: Timestamp;
}

export interface GenerationDoc {
  genId: string;
  ownerUid: string;
  petId: string;
  coreId: string;
  type: GenerationType;
  apparel: string[];
  background: string;
  userPrompt: string;
  storagePath: string;
  imageUrl: string; // 다운로드 토큰 URL(표시용)
  quality: Quality;
  costUsd: number;
  status: AssetStatus;
  shared: boolean;
  likes: number;
  createdAt: Timestamp;
}

export interface ApparelDoc {
  apparelId: string;
  category: ApparelCategory;
  nameI18n: I18nText;
  anchor: string;
  promptFragment: string;
  season: string | null;
  active: boolean;
}

export interface GoodsDoc {
  goodsId: string;
  nameI18n: I18nText;
  genCostUsd: number;
  printCostKrw: number | null;
  priceKrw: number;
  requiredImages: number;
  active: boolean;
}

export interface OrderDoc {
  orderId: string;
  ownerUid: string;
  goodsId: string;
  genIds: string[];
  amountKrw: number;
  genCostUsd: number;
  printCostKrw: number | null;
  status: OrderStatus;
  createdAt: Timestamp;
}

export interface CostLogDoc {
  logId: string;
  uid: string;
  endpoint: string;
  model: string;
  quality: Quality;
  costUsd: number;
  period: string;
  createdAt: Timestamp;
}

export interface AdminConfigDoc {
  defaultQuality: Quality;
  monthlyCostCapUsd: number;
  tierLimits: Record<Tier, number>;
  usdKrw: number;
}
