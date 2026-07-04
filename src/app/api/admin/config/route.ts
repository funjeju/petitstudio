import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { getAdminConfig } from '@/lib/server/config';
import { parseJson } from '@/lib/server/generation';
import type { Quality, Tier } from '@/lib/types';

const QUALITIES: Quality[] = ['low', 'medium', 'high'];

// GET /api/admin/config — 현재 전역 설정. 07 §2.3
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await getAdminConfig());
}

// PUT /api/admin/config — 기본 품질/등급한도/총액상한/환율 갱신(검증 후 merge).
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseJson<{
    defaultQuality?: string;
    tierLimits?: Partial<Record<Tier, number>>;
    monthlyCostCapUsd?: number;
    usdKrw?: number;
  }>(req);

  const update: Record<string, unknown> = {};
  if (body.defaultQuality && QUALITIES.includes(body.defaultQuality as Quality)) {
    update.defaultQuality = body.defaultQuality;
  }
  if (body.tierLimits) {
    const cur = (await getAdminConfig()).tierLimits;
    const merged = { ...cur };
    (['free', 'pro', 'vip'] as Tier[]).forEach((k) => {
      const v = body.tierLimits?.[k];
      if (typeof v === 'number' && v >= 0) merged[k] = Math.floor(v);
    });
    update.tierLimits = merged;
  }
  if (typeof body.monthlyCostCapUsd === 'number' && body.monthlyCostCapUsd > 0) {
    update.monthlyCostCapUsd = body.monthlyCostCapUsd;
  }
  if (typeof body.usdKrw === 'number' && body.usdKrw > 0) {
    update.usdKrw = body.usdKrw;
  }

  await adminDb().doc('adminConfig/global').set(update, { merge: true });
  return NextResponse.json(await getAdminConfig());
}
