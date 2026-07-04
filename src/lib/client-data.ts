'use client';

/**
 * 클라이언트 Firestore 조회 — 보안규칙이 허용하는 read 만.
 * 복합 인덱스 회피를 위해 단일 equality where 만 쓰고, 정렬/부가 필터는 JS 로 처리.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase/client';
import type { CoreImageDoc, GenerationDoc, PetDoc, Species } from './types';

function toMillis(t: unknown): number {
  return (t as Timestamp)?.toMillis?.() ?? 0;
}

/** 공개 피드: shared==true 인 생성물(활성만), 최신순. */
export async function fetchFeed(): Promise<GenerationDoc[]> {
  const q = query(collection(getDb(), 'generations'), where('shared', '==', true));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as GenerationDoc)
    .filter((g) => g.status === 'active')
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

/** 내 펫 목록. */
export async function fetchMyPets(uid: string): Promise<PetDoc[]> {
  const q = query(collection(getDb(), 'pets'), where('ownerUid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as PetDoc)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

/** 내 코어 이미지(활성). */
export async function fetchMyCores(uid: string): Promise<CoreImageDoc[]> {
  const q = query(collection(getDb(), 'coreImages'), where('ownerUid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as CoreImageDoc)
    .filter((c) => c.status === 'active')
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

/** 내 생성물(활성). */
export async function fetchMyGenerations(uid: string): Promise<GenerationDoc[]> {
  const q = query(collection(getDb(), 'generations'), where('ownerUid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as GenerationDoc)
    .filter((g) => g.status === 'active')
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function fetchCore(coreId: string): Promise<CoreImageDoc | null> {
  const snap = await getDoc(doc(getDb(), 'coreImages', coreId));
  return snap.exists() ? (snap.data() as CoreImageDoc) : null;
}

/** 생성물 피드 공개(옵트인, 06 §7). 규칙상 소유자만 shared 토글 가능. */
export async function shareGeneration(genId: string): Promise<void> {
  await updateDoc(doc(getDb(), 'generations', genId), { shared: true });
}

/**
 * 실제 펫 등록(클라이언트 write — 보안규칙: ownerUid==uid 허용).
 * 가상 펫은 서버(/api/virtualpet/create)에서 생성하므로 여기선 실제 펫만.
 */
export async function createPet(input: {
  ownerUid: string;
  name: string;
  species: Species;
  breed: string;
}): Promise<string> {
  const refDoc = doc(collection(getDb(), 'pets'));
  await setDoc(refDoc, {
    petId: refDoc.id,
    ownerUid: input.ownerUid,
    name: input.name,
    species: input.species,
    breed: input.breed,
    isVirtual: false,
    virtualRecipe: null,
    birthday: null,
    adoptedAt: null,
    createdAt: serverTimestamp(),
  });
  return refDoc.id;
}
