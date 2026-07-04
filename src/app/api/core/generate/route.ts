import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { checkAndReserve, commitCost, refundReservation } from '@/lib/server/cost-guardian';
import { generateImage, editImage, hasOpenAiKey } from '@/lib/server/openai';
import { uploadPng } from '@/lib/server/storage';
import { newId, saveCoreImage } from '@/lib/server/assets';
import { collectReferenceImages, normalizeQuality, parseJson } from '@/lib/server/generation';
import { buildCorePrompt, PromptError } from '@/lib/prompt';
import { adminDb } from '@/lib/firebase/admin';
import type { PetDoc, Species } from '@/lib/types';

// POST /api/core/generate — 코어 이미지 생성 (인증+크레딧+총액). 02 §4 / 04 §2.1
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasOpenAiKey()) {
    return NextResponse.json({ error: 'OPENAI_API_KEY 미설정' }, { status: 503 });
  }

  const body = await parseJson<{
    petId?: string;
    sourcePaths?: string[];
    sourceImages?: string[];
    quality?: string;
  }>(req);

  if (!body.petId) return NextResponse.json({ error: 'petId 필요' }, { status: 400 });

  // 펫 소유권 확인 + 종/품종 로드.
  const petSnap = await adminDb().doc(`pets/${body.petId}`).get();
  if (!petSnap.exists) return NextResponse.json({ error: 'pet not found' }, { status: 404 });
  const pet = petSnap.data() as PetDoc;
  if (pet.ownerUid !== auth.uid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const quality = normalizeQuality(body.quality);
  const species: Species = pet.species ?? 'other';

  let refs: Buffer[];
  let prompt: string;
  try {
    refs = await collectReferenceImages({
      uid: auth.uid,
      sourcePaths: body.sourcePaths,
      sourceImages: body.sourceImages,
    });
    prompt = buildCorePrompt(species, pet.breed);
  } catch (e) {
    const status = e instanceof PromptError ? 400 : 400;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }

  // 사전 검사 + 크레딧 선차감.
  const guard = await checkAndReserve({
    uid: auth.uid,
    endpoint: 'core.generate',
    quality,
    edit: refs.length > 0,
  });
  if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: guard.status });

  try {
    const png = refs.length
      ? await editImage({ prompt, images: refs, quality })
      : await generateImage({ prompt, quality });

    const coreId = newId('coreImages');
    const storagePath = `coreImages/${auth.uid}/${coreId}.png`;
    const { url } = await uploadPng(storagePath, png);

    const costUsd = await commitCost({
      uid: auth.uid,
      endpoint: 'core.generate',
      quality,
      edit: refs.length > 0,
      period: guard.reserved.period,
    });
    await saveCoreImage(coreId, {
      ownerUid: auth.uid,
      petId: body.petId,
      storagePath,
      imageUrl: url,
      quality,
      costUsd,
    });

    return NextResponse.json({ coreId, url, remaining: guard.reserved.remaining });
  } catch (e) {
    // 생성 실패 → 선차감 롤백.
    await refundReservation(auth.uid, guard.reserved.period);
    return NextResponse.json({ error: `generation failed: ${(e as Error).message}` }, { status: 502 });
  }
}
