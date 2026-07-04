import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { parseJson } from '@/lib/server/generation';
import type { Role, Tier, UserDoc } from '@/lib/types';

const TIERS: Tier[] = ['free', 'pro', 'vip'];
const ROLES: Role[] = ['user', 'admin'];

// GET /api/admin/users — 회원 목록(최근 100). 07 §2.1
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const snap = await adminDb().collection('users').limit(100).get();
  const users = snap.docs.map((d) => {
    const u = d.data() as UserDoc;
    return {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      tier: u.tier,
      role: u.role,
      credits: u.credits,
    };
  });
  return NextResponse.json({ users });
}

// PATCH /api/admin/users — 등급/역할/크레딧 한도 수동 조정(고객대응).
export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseJson<{ uid?: string; tier?: string; role?: string; creditsLimit?: number }>(req);
  if (!body.uid) return NextResponse.json({ error: 'uid 필요' }, { status: 400 });

  const ref = adminDb().doc(`users/${body.uid}`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'user not found' }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (body.tier && TIERS.includes(body.tier as Tier)) update.tier = body.tier;
  if (body.role && ROLES.includes(body.role as Role)) update.role = body.role;
  if (typeof body.creditsLimit === 'number' && body.creditsLimit >= 0) {
    const credits = (snap.get('credits') as UserDoc['credits']) ?? {
      period: '',
      used: 0,
      trialUsed: false,
      limit: 0,
    };
    update.credits = { ...credits, limit: Math.floor(body.creditsLimit) };
  }

  await ref.set(update, { merge: true });
  return NextResponse.json({ ok: true });
}
