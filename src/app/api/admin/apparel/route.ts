import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { parseJson } from '@/lib/server/generation';
import type { ApparelCategory, ApparelDoc } from '@/lib/types';

const CATEGORIES: ApparelCategory[] = ['hat', 'outfit', 'accessory', 'season', 'prop'];
const ANCHORS = ['head', 'neck', 'body', 'face', 'paw', 'prop'];

// GET /api/admin/apparel — 어패럴 카탈로그 전체(어드민). 07 §2.2
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const snap = await adminDb().collection('apparel').get();
  return NextResponse.json({ apparel: snap.docs.map((d) => d.data()) });
}

// POST /api/admin/apparel — 어패럴 upsert(id 지정). 프롬프트 조각/anchor 관리.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseJson<Partial<ApparelDoc>>(req);
  if (!body.apparelId) return NextResponse.json({ error: 'apparelId 필요' }, { status: 400 });
  if (!body.anchor || !ANCHORS.includes(body.anchor)) {
    return NextResponse.json({ error: `anchor 는 ${ANCHORS.join('|')}` }, { status: 400 });
  }
  const category: ApparelCategory = CATEGORIES.includes(body.category as ApparelCategory)
    ? (body.category as ApparelCategory)
    : 'accessory';

  const doc: ApparelDoc = {
    apparelId: body.apparelId,
    category,
    nameI18n: body.nameI18n ?? {},
    anchor: body.anchor,
    promptFragment: body.promptFragment ?? '',
    season: body.season ?? null,
    active: body.active ?? true,
  };
  await adminDb().doc(`apparel/${doc.apparelId}`).set(doc, { merge: true });
  return NextResponse.json({ ok: true, apparel: doc });
}

// DELETE /api/admin/apparel?id=... — 어패럴 삭제.
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
  await adminDb().doc(`apparel/${id}`).delete();
  return NextResponse.json({ ok: true });
}
