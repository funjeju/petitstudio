# SETUP — Phase 0 실행 가이드

petit studio 앱 골격을 로컬에서 띄우고 배포하기 위한 최소 가이드.
설계 근거는 `ORCHESTRATOR.md` 및 `docs/`.

## 요구사항
- Node 20+ (개발 검증: v22)

## 1. 의존성 설치
```bash
npm install
```

## 2. 환경변수
`.env.example` 를 복사해 `.env.local` 생성 후 값 채우기. (`.env.local` 커밋 금지)
```bash
cp .env.example .env.local
```
- 서버 전용(노출 금지): `OPENAI_API_KEY`, `FIREBASE_ADMIN_*`, `MONTHLY_COST_CAP_USD`
- 공개 가능: `NEXT_PUBLIC_FIREBASE_*` (Firebase 콘솔 → 프로젝트 설정 → 웹 앱)

> 값이 비어도 빌드/기동은 되지만, 인증·생성 API 는 401/503 을 반환합니다(의도된 동작).

## 3. 개발 서버
```bash
npm run dev
# http://localhost:3000  →  /ko 로 리다이렉트(기본 로케일)
```

## 4. 검증
```bash
npm run typecheck   # tsc --noEmit
npm run build       # 프로덕션 빌드 (18개 로케일 SSG)
```

## 라우트 맵 (현재 골격)
| 경로 | 상태 |
|---|---|
| `/[locale]` | 홈(히어로 + CTA) |
| `/[locale]/explore · create · collection · studio` | 자리표시자(Coming soon) |
| `POST /api/me/bootstrap` | 인증 → 최초 로그인 시 users/{uid} 생성(멱등), 사용량 반환 |
| `GET /api/me/usage` | 인증 → 크레딧/등급 반환 |
| `POST /api/core/generate` | 인증+크레딧 선차감→(미구현) 환불→501 |
| `POST /api/fitting/apply` | 〃 (edit 1.8x) |
| `POST /api/virtualpet/create` | 〃 (edit) |
| `POST /api/goods/preview` | 〃 (high 세로) → 501 (Phase 4) |
| `POST /api/image/delete` | 인증 → 501 (Phase 2) |
| `GET /api/admin/metrics` | 인증+어드민 → 501 (Phase 5) |

## 보안규칙 배포 (Firebase CLI)
```bash
firebase deploy --only firestore:rules,storage
```
규칙 파일: `firestore.rules`, `storage.rules`

## Phase 1 완료 상태
- Google 로그인(팝업) + onIdTokenChanged 세션, 셸에 로그인/로그아웃 UI
- 최초 로그인 시 `users/{uid}` 서버 부트스트랩(tier=free, credits limit=5)
- `cost-guardian`: 트랜잭션 크레딧 선차감/환불, 주기(YYYY-MM) 리셋, 월 총액 kill switch(`costTotals/{period}` + `MONTHLY_COST_CAP_USD`), `commitCost` 원가 로깅
- 가격/등급 모듈: `src/lib/pricing.ts`(cost-calculator 포팅), `src/lib/tiers.ts`(안 B)

> ⚠️ 실제 로그인 테스트는 `.env.local` 에 Firebase 웹 설정 + Admin 자격증명이 있어야 동작.
> 키가 없으면 로그인 버튼은 뜨지만 팝업/부트스트랩이 실패(의도된 안전 동작).

## 다음 단계 (Phase 2 — 핵심 생성 루프)
1. 코어 이미지 생성: GPT Image 2 서버 호출 → Storage 저장 → `coreImages` 기록 → `commitCost()`
   (generate 라우트의 `refundReservation` 자리를 실제 생성으로 교체)
2. 가상 피팅룸(edit 합성) / 가상 펫
3. 자동 저장 + 소프트 삭제(`/api/image/delete`)
빌드 순서 상세는 `ORCHESTRATOR.md §4`.
