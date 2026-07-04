import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { trashAsset } from '@/lib/server/assets';
import { parseJson } from '@/lib/server/generation';

// POST /api/image/delete — 소프트 삭제(휴지통) (인증). 03 §4
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await parseJson<{ collection?: string; id?: string }>(req);
  if (body.collection !== 'coreImages' && body.collection !== 'generations') {
    return NextResponse.json({ error: "collection 은 'coreImages' | 'generations'" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });

  const res = await trashAsset(body.collection, body.id, auth.uid);
  if (!res.ok) return NextResponse.json({ error: res.reason }, { status: res.status });
  return NextResponse.json({ ok: true });
}
