import 'server-only';

import type { Quality } from '@/lib/types';

/**
 * GPT Image 2 클라이언트 — 04_IMAGE_GENERATION.md §1.
 * 키는 서버 env(OPENAI_API_KEY)에만. 클라이언트 노출 금지(02 §3).
 */
const OPENAI_BASE = 'https://api.openai.com/v1';
export const IMAGE_MODEL = 'gpt-image-2-2026-04-21';

export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024';

/** 키 미설정 여부 — 라우트에서 사전 안내(503)에 사용. */
export function hasOpenAiKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY 미설정 (.env.local 확인)');
  return key;
}

/** 신규 생성(text→image). 참조 이미지 없을 때. */
export async function generateImage(opts: {
  prompt: string;
  quality: Quality;
  size?: ImageSize;
}): Promise<Buffer> {
  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey()}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: opts.prompt,
      size: opts.size ?? '1024x1024',
      quality: opts.quality,
      n: 1,
    }),
  });
  return handleImageResponse(res);
}

/** 참조 이미지 편집/합성(images+prompt→image). 코어 생성(펫 사진)·피팅룸·가상펫에 사용. */
export async function editImage(opts: {
  prompt: string;
  images: Buffer[];
  quality: Quality;
  size?: ImageSize;
}): Promise<Buffer> {
  const form = new FormData();
  form.append('model', IMAGE_MODEL);
  form.append('prompt', opts.prompt);
  form.append('size', opts.size ?? '1024x1024');
  form.append('quality', opts.quality);
  form.append('n', '1');
  for (const buf of opts.images) {
    form.append('image[]', new Blob([new Uint8Array(buf)], { type: 'image/png' }), 'image.png');
  }

  const res = await fetch(`${OPENAI_BASE}/images/edits`, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey()}` },
    body: form,
  });
  return handleImageResponse(res);
}

async function handleImageResponse(res: Response): Promise<Buffer> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI image error ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI: 이미지 데이터 없음');
  return Buffer.from(b64, 'base64');
}
