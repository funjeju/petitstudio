'use client';

import { getClientAuth } from './firebase/client';

/**
 * 인증 토큰을 자동 첨부하는 fetch 래퍼. 서버 API(/api/*) 호출에 사용.
 * 서버는 Authorization: Bearer <idToken> 로 유저를 식별(02_ARCHITECTURE §2).
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const current = getClientAuth().currentUser;
  const token = current ? await current.getIdToken() : null;
  const headers = new Headers(init.headers);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  return fetch(input, { ...init, headers });
}
