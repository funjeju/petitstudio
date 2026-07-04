import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import type {
  ApparelDoc,
  GenerationType,
  Quality,
  Species,
} from '@/lib/types';
import type { ApparelFragment, VirtualRecipe } from '@/lib/prompt';

/** 새 문서 ID 선발급(Storage 경로에 id를 쓰기 위해 저장 전에 확보). */
export function newId(collection: string): string {
  return adminDb().collection(collection).doc().id;
}

export async function savePet(
  petId: string,
  data: {
    ownerUid: string;
    name: string;
    species: Species;
    breed: string;
    isVirtual: boolean;
    virtualRecipe: VirtualRecipe | null;
  },
): Promise<void> {
  await adminDb().doc(`pets/${petId}`).set({
    petId,
    ...data,
    birthday: null,
    adoptedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function saveCoreImage(
  coreId: string,
  data: {
    ownerUid: string;
    petId: string;
    storagePath: string;
    imageUrl: string;
    quality: Quality;
    costUsd: number;
  },
): Promise<void> {
  await adminDb().doc(`coreImages/${coreId}`).set({
    coreId,
    ...data,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function saveGeneration(
  genId: string,
  data: {
    ownerUid: string;
    petId: string;
    coreId: string;
    type: GenerationType;
    apparel: string[];
    background: string;
    userPrompt: string;
    storagePath: string;
    imageUrl: string;
    quality: Quality;
    costUsd: number;
  },
): Promise<void> {
  await adminDb().doc(`generations/${genId}`).set({
    genId,
    ...data,
    status: 'active',
    shared: false,
    likes: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** 소프트 삭제(03 §4): 소유자 확인 후 status:'trashed'. 하드 삭제는 배치 전용. */
export async function trashAsset(
  collection: 'coreImages' | 'generations',
  id: string,
  uid: string,
): Promise<{ ok: boolean; status: number; reason?: string }> {
  const ref = adminDb().doc(`${collection}/${id}`);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, status: 404, reason: 'not found' };
  if (snap.get('ownerUid') !== uid) return { ok: false, status: 403, reason: 'forbidden' };
  await ref.set({ status: 'trashed' }, { merge: true });
  return { ok: true, status: 200 };
}

/** 어패럴 카탈로그 조회 → 프롬프트 조각 목록. 비활성/없는 id는 제외. */
export async function loadApparelFragments(ids: string[]): Promise<ApparelFragment[]> {
  if (ids.length === 0) return [];
  const refs = ids.map((id) => adminDb().doc(`apparel/${id}`));
  const snaps = await adminDb().getAll(...refs);
  return snaps
    .filter((s) => s.exists && s.get('active') !== false)
    .map((s) => {
      const d = s.data() as ApparelDoc;
      return { apparelId: d.apparelId, anchor: d.anchor, promptFragment: d.promptFragment };
    });
}
