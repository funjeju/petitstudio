import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { checkAndReserve, commitCost, refundReservation } from '@/lib/server/cost-guardian';
import { generateImage, editImage, hasOpenAiKey } from '@/lib/server/openai';
import { uploadPng } from '@/lib/server/storage';
import { newId, savePet, saveCoreImage } from '@/lib/server/assets';
import { collectReferenceImages, normalizeQuality, parseJson } from '@/lib/server/generation';
import { buildVirtualPetPrompt, sanitizeUserPrompt, PromptError, type VirtualRecipe } from '@/lib/prompt';

// POST /api/virtualpet/create — 가상 펫 생성 (인증+크레딧+총액). 04 §2.4
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasOpenAiKey()) {
    return NextResponse.json({ error: 'OPENAI_API_KEY 미설정' }, { status: 503 });
  }

  const body = await parseJson<{
    name?: string;
    recipe?: VirtualRecipe;
    sourcePaths?: string[];
    sourceImages?: string[];
    quality?: string;
  }>(req);

  const name = sanitizeUserPrompt(body.name) || '가상 펫';
  const quality = normalizeQuality(body.quality);

  let prompt: string;
  let refs: Buffer[];
  try {
    if (!body.recipe) throw new PromptError('recipe 필요');
    prompt = buildVirtualPetPrompt(body.recipe);
    refs = await collectReferenceImages({
      uid: auth.uid,
      sourcePaths: body.sourcePaths,
      sourceImages: body.sourceImages,
    });
  } catch (e) {
    const status = e instanceof PromptError ? 400 : 400;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }

  const guard = await checkAndReserve({
    uid: auth.uid,
    endpoint: 'virtualpet.create',
    quality,
    edit: refs.length > 0,
  });
  if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: guard.status });

  try {
    const png = refs.length
      ? await editImage({ prompt, images: refs, quality })
      : await generateImage({ prompt, quality });

    // 가상 펫 → pets 문서(재생성용 레시피 보관) + 코어 이미지로 코어化(04 §2.4).
    const petId = newId('pets');
    const breed = (body.recipe.parts ?? []).join(' + ');
    await savePet(petId, {
      ownerUid: auth.uid,
      name,
      species: 'virtual',
      breed,
      isVirtual: true,
      virtualRecipe: body.recipe,
    });

    const coreId = newId('coreImages');
    const storagePath = `coreImages/${auth.uid}/${coreId}.png`;
    const { url } = await uploadPng(storagePath, png);

    const costUsd = await commitCost({
      uid: auth.uid,
      endpoint: 'virtualpet.create',
      quality,
      edit: refs.length > 0,
      period: guard.reserved.period,
    });
    await saveCoreImage(coreId, {
      ownerUid: auth.uid,
      petId,
      storagePath,
      imageUrl: url,
      quality,
      costUsd,
    });

    return NextResponse.json({ petId, coreId, url, remaining: guard.reserved.remaining });
  } catch (e) {
    await refundReservation(auth.uid, guard.reserved.period);
    return NextResponse.json({ error: `generation failed: ${(e as Error).message}` }, { status: 502 });
  }
}
