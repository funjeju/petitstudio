import 'server-only';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * 서버 전용 Admin SDK. 크레딧 차감/토큰 검증/원가 로깅에만 사용.
 * 'server-only' 로 클라이언트 번들 유입 시 빌드 에러 발생.
 * FIREBASE_ADMIN_* 는 서버 환경변수 — 02_ARCHITECTURE.md §3.
 */
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());

/** Authorization: Bearer <idToken> 검증 → uid 반환(실패 시 null). */
export async function verifyIdToken(idToken: string | undefined) {
  if (!idToken) return null;
  try {
    return await adminAuth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}
