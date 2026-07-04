import 'server-only';

import { readObject } from './storage';
import type { Quality } from '@/lib/types';

/** 요청 바디 안전 파싱(없으면 빈 객체). */
export async function parseJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

const VALID_QUALITIES: readonly string[] = ['low', 'medium', 'high'];

export function normalizeQuality(q: unknown, fallback: Quality = 'medium'): Quality {
  return typeof q === 'string' && VALID_QUALITIES.includes(q) ? (q as Quality) : fallback;
}

/** data URL 또는 raw base64 → Buffer. */
export function decodeImageInput(s: string): Buffer {
  const comma = s.indexOf(',');
  const b64 = s.startsWith('data:') && comma >= 0 ? s.slice(comma + 1) : s;
  return Buffer.from(b64, 'base64');
}

/**
 * 참조 이미지 수집. sourcePaths 는 반드시 본인 uid 하위 경로만 허용(권한 우회 방지).
 * sourceImages 는 클라이언트가 직접 보낸 base64(업로드 UI 미비 시 임시 경로).
 */
export async function collectReferenceImages(opts: {
  uid: string;
  sourcePaths?: string[];
  sourceImages?: string[];
  max?: number;
}): Promise<Buffer[]> {
  const max = opts.max ?? 4;
  const bufs: Buffer[] = [];

  for (const p of opts.sourcePaths ?? []) {
    if (bufs.length >= max) break;
    const allowed =
      p.startsWith(`uploads/${opts.uid}/`) ||
      p.startsWith(`coreImages/${opts.uid}/`) ||
      p.startsWith(`generations/${opts.uid}/`);
    if (!allowed) throw new Error(`허용되지 않은 참조 경로: ${p}`);
    bufs.push(await readObject(p));
  }

  for (const img of opts.sourceImages ?? []) {
    if (bufs.length >= max) break;
    bufs.push(decodeImageInput(img));
  }

  return bufs;
}
