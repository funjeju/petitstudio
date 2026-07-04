import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { checkAndReserve, commitCost, refundReservation } from '@/lib/server/cost-guardian';
import { editImage, hasOpenAiKey } from '@/lib/server/openai';
import { uploadPng, readObject } from '@/lib/server/storage';
import { newId, saveGeneration, loadApparelFragments } from '@/lib/server/assets';
import { collectReferenceImages, normalizeQuality, parseJson } from '@/lib/server/generation';
import { buildFittingPrompt, sanitizeUserPrompt, PromptError } from '@/lib/prompt';
import { adminDb } from '@/lib/firebase/admin';
import type { CoreImageDoc, PetDoc, Species } from '@/lib/types';

// POST /api/fitting/apply — 어패럴/배경 합성(edit) (인증+크레딧+총액). 04 §2.2
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasOpenAiKey()) {
    return NextResponse.json({ error: 'OPENAI_API_KEY 미설정' }, { status: 503 });
  }

  const body = await parseJson<{
    coreId?: string;
    apparel?: string[];
    apparelPaths?: string[]; // 유저가 업로드한 아이템 이미지(uploads/{uid}/...)
    apparelImages?: string[]; // base64 아이템 이미지
    background?: string;
    userPrompt?: string;
    quality?: string;
  }>(req);

  if (!body.coreId) return NextResponse.json({ error: 'coreId 필요' }, { status: 400 });

  // 코어 이미지 소유권 확인.
  const coreSnap = await adminDb().doc(`coreImages/${body.coreId}`).get();
  if (!coreSnap.exists) return NextResponse.json({ error: 'core not found' }, { status: 404 });
  const core = coreSnap.data() as CoreImageDoc;
  if (core.ownerUid !== auth.uid) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const quality = normalizeQuality(body.quality);
  const apparelIds = body.apparel ?? [];

  // 종 정보(자연스러운 착장 문구용).
  let species: Species = 'other';
  const petSnap = await adminDb().doc(`pets/${core.petId}`).get();
  if (petSnap.exists) species = (petSnap.data() as PetDoc).species ?? 'other';

  let prompt: string;
  let userPromptClean: string;
  let itemImages: Buffer[];
  try {
    // 유저가 첨부한 아이템(옷·모자·액세서리) 이미지 수집.
    itemImages = await collectReferenceImages({
      uid: auth.uid,
      sourcePaths: body.apparelPaths,
      sourceImages: body.apparelImages,
      max: 3,
    });
    const apparel = await loadApparelFragments(apparelIds);
    prompt = buildFittingPrompt({
      species,
      apparel,
      background: body.background,
      userPrompt: body.userPrompt,
      attachedItems: itemImages.length > 0,
    });
    userPromptClean = sanitizeUserPrompt(body.userPrompt);
  } catch (e) {
    const status = e instanceof PromptError ? 400 : 400;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }

  const guard = await checkAndReserve({
    uid: auth.uid,
    endpoint: 'fitting.apply',
    quality,
    edit: true, // 피팅룸은 참조 edit → EDIT_FACTOR
  });
  if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: guard.status });

  try {
    const base = await readObject(core.storagePath);
    // 첫 이미지=코어(펫), 이후=첨부 아이템 → 아이템을 펫에 합성.
    const png = await editImage({ prompt, images: [base, ...itemImages], quality });

    const genId = newId('generations');
    const storagePath = `generations/${auth.uid}/${genId}.png`;
    const { url } = await uploadPng(storagePath, png);

    const costUsd = await commitCost({
      uid: auth.uid,
      endpoint: 'fitting.apply',
      quality,
      edit: true,
      period: guard.reserved.period,
    });
    await saveGeneration(genId, {
      ownerUid: auth.uid,
      petId: core.petId,
      coreId: body.coreId,
      type: 'fitting',
      apparel: apparelIds,
      background: body.background ?? '',
      userPrompt: userPromptClean,
      storagePath,
      imageUrl: url,
      quality,
      costUsd,
    });

    return NextResponse.json({ genId, url, remaining: guard.reserved.remaining });
  } catch (e) {
    await refundReservation(auth.uid, guard.reserved.period);
    return NextResponse.json({ error: `generation failed: ${(e as Error).message}` }, { status: 502 });
  }
}
