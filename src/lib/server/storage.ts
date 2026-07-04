import 'server-only';

import { randomUUID } from 'crypto';
import { adminStorage } from '@/lib/firebase/admin';

/**
 * Firebase Storage 헬퍼(서버). 생성 이미지 자동 저장 + 원본 참조 읽기.
 * 03_DATA_MODEL.md §3 경로 규약 사용.
 */
function bucket() {
  return adminStorage().bucket();
}

/** PNG 저장 후 다운로드 토큰이 붙은 안정 URL 반환(클라이언트가 바로 표시 가능). */
export async function uploadPng(path: string, data: Buffer): Promise<{ path: string; url: string }> {
  const token = randomUUID();
  const file = bucket().file(path);
  await file.save(data, {
    resumable: false,
    contentType: 'image/png',
    metadata: { metadata: { firebaseStorageDownloadTokens: token } },
  });
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket().name}/o/${encodeURIComponent(
    path,
  )}?alt=media&token=${token}`;
  return { path, url };
}

/** Storage 객체 바이트 읽기(원본 업로드/코어 이미지 참조용). */
export async function readObject(path: string): Promise<Buffer> {
  const [buf] = await bucket().file(path).download();
  return buf;
}
