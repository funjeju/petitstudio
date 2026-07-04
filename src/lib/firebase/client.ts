import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * 클라이언트 Firebase SDK. NEXT_PUBLIC_* 만 사용(공개 가능, 보안규칙으로 방어).
 * OpenAI 키/Admin 자격증명은 여기 절대 포함 금지 — 02_ARCHITECTURE.md §3.
 *
 * 지연 초기화(lazy): getAuth 등은 유효 키가 없으면 throw 하므로 모듈 로드 시점이 아니라
 * 실제 사용 시점(브라우저)에만 초기화한다. → SSG 프리렌더 중 auth/invalid-api-key 회피.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getClientApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let _auth: Auth | undefined;
export function getClientAuth(): Auth {
  if (!_auth) _auth = getAuth(getClientApp());
  return _auth;
}

export function getGoogleProvider(): GoogleAuthProvider {
  return new GoogleAuthProvider();
}

let _db: Firestore | undefined;
export function getDb(): Firestore {
  if (!_db) _db = getFirestore(getClientApp());
  return _db;
}

let _storage: FirebaseStorage | undefined;
export function getClientStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getClientApp());
  return _storage;
}
