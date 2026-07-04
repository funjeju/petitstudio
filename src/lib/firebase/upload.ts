'use client';

import { ref, uploadBytes } from 'firebase/storage';
import { getClientStorage } from './client';

/**
 * 원본 사진을 uploads/{uid}/ 에 업로드하고 Storage 경로 반환.
 * 이 경로를 생성 API 의 sourcePaths 로 전달(권한: 본인 uid 하위만).
 */
export async function uploadOriginal(uid: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const id = crypto.randomUUID();
  const path = `uploads/${uid}/${id}.${ext}`;
  await uploadBytes(ref(getClientStorage(), path), file, { contentType: file.type });
  return path;
}
