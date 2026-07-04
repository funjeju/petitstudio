import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { getAdminConfig } from '@/lib/server/config';
import { currentPeriod, usdToKrw } from '@/lib/pricing';

// GET /api/admin/metrics — 투자용 지표 (07 §3). 원가 실시간 누계 포함.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const db = adminDb();
  const period = currentPeriod();
  const cfg = await getAdminConfig();

  // 카운트 집계(문서 전량 읽지 않도록 count()).
  const [total, free, pro, vip, gens, monthTotalSnap, allTotalsSnap] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('users').where('tier', '==', 'free').count().get(),
    db.collection('users').where('tier', '==', 'pro').count().get(),
    db.collection('users').where('tier', '==', 'vip').count().get(),
    db.collection('generations').count().get(),
    db.doc(`costTotals/${period}`).get(),
    db.collection('costTotals').get(),
  ]);

  const monthUsd = (monthTotalSnap.exists ? (monthTotalSnap.get('costUsd') as number) : 0) ?? 0;
  const monthCount = (monthTotalSnap.exists ? (monthTotalSnap.get('count') as number) : 0) ?? 0;
  const allTimeUsd = allTotalsSnap.docs.reduce((sum, d) => sum + ((d.get('costUsd') as number) ?? 0), 0);

  return NextResponse.json({
    period,
    users: {
      total: total.data().count,
      free: free.data().count,
      pro: pro.data().count,
      vip: vip.data().count,
    },
    generations: gens.data().count,
    cost: {
      monthUsd,
      monthKrw: usdToKrw(monthUsd, cfg.usdKrw),
      monthCount,
      allTimeUsd,
      allTimeKrw: usdToKrw(allTimeUsd, cfg.usdKrw),
    },
    capUsd: cfg.monthlyCostCapUsd,
    capUsedPct: cfg.monthlyCostCapUsd ? Math.round((monthUsd / cfg.monthlyCostCapUsd) * 100) : 0,
  });
}
