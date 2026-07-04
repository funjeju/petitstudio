import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { checkAndReserve, commitCost, refundReservation } from '@/lib/server/cost-guardian';
import { editImage, hasOpenAiKey } from '@/lib/server/openai';
import { uploadPng, readObject } from '@/lib/server/storage';
import { newId, saveGeneration, loadApparelFragments } from '@/lib/server/assets';
import { parseJson } from '@/lib/server/generation';
import { buildFittingPrompt } from '@/lib/prompt';
import { adminDb } from '@/lib/firebase/admin';
import type { CoreImageDoc, GenerationDoc, PetDoc, Species } from '@/lib/types';

// POST /api/goods/preview — 굿즈용 high(세로) 재생성. 04 §2.5 / goods-mockup 스킬.
// 기존 생성물(genId)의 룩을 코어에 high 로 다시 입혀 인쇄 해상도 확보(생성원가 발생).
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasOpenAiKey()) return NextResponse.json({ error: 'OPENAI_API_KEY 미설정' }, { status: 503 });

  const body = await parseJson<{ genId?: string }>(req);
  if (!body.genId) return NextResponse.json({ error: 'genId 필요' }, { status: 400 });

  // 원본 생성물 소유권 확인 + 룩 정보 로드.
  const genSnap = await adminDb().doc(`generations/${body.genId}`).get();
  if (!genSnap.exists) return NextResponse.json({ error: 'generation not found' }, { status: 404 });
  const gen = genSnap.data() as GenerationDoc;
  if (gen.ownerUid !== auth.uid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // 코어 이미지(베이스) 로드.
  const coreSnap = await adminDb().doc(`coreImages/${gen.coreId}`).get();
  if (!coreSnap.exists) return NextResponse.json({ error: 'core not found' }, { status: 404 });
  const core = coreSnap.data() as CoreImageDoc;

  let species: Species = 'other';
  const petSnap = await adminDb().doc(`pets/${gen.petId}`).get();
  if (petSnap.exists) species = (petSnap.data() as PetDoc).species ?? 'other';

  const apparel = await loadApparelFragments(gen.apparel ?? []);
  const prompt = buildFittingPrompt({
    species,
    apparel,
    background: gen.background,
    userPrompt: gen.userPrompt,
  });

  const guard = await checkAndReserve({
    uid: auth.uid,
    endpoint: 'goods.preview',
    quality: 'high',
    edit: true,
    portrait: true,
  });
  if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: guard.status });

  try {
    const base = await readObject(core.storagePath);
    const png = await editImage({ prompt, images: [base], quality: 'high', size: '1024x1536' });

    const genId = newId('generations');
    const storagePath = `generations/${auth.uid}/${genId}.png`;
    const { url } = await uploadPng(storagePath, png);

    const costUsd = await commitCost({
      uid: auth.uid,
      endpoint: 'goods.preview',
      quality: 'high',
      edit: true,
      portrait: true,
      period: guard.reserved.period,
    });
    await saveGeneration(genId, {
      ownerUid: auth.uid,
      petId: gen.petId,
      coreId: gen.coreId,
      type: 'goods',
      apparel: gen.apparel ?? [],
      background: gen.background,
      userPrompt: gen.userPrompt,
      storagePath,
      imageUrl: url,
      quality: 'high',
      costUsd,
    });

    return NextResponse.json({ genId, url, remaining: guard.reserved.remaining });
  } catch (e) {
    await refundReservation(auth.uid, guard.reserved.period);
    return NextResponse.json({ error: `generation failed: ${(e as Error).message}` }, { status: 502 });
  }
}
