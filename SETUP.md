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
| `POST /api/core/generate` | 인증+가드→GPT Image 2 생성→Storage 저장→`coreImages` 기록 |
| `POST /api/fitting/apply` | 〃 edit 합성(어패럴 anchor 레이어링+배경+userPrompt)→`generations` |
| `POST /api/virtualpet/create` | 〃 가상펫 합성→`pets`(isVirtual)+코어 이미지 |
| `POST /api/image/delete` | 인증→소프트 삭제(status:'trashed') |
| `POST /api/goods/preview` | 인증+가드(high 세로)→501 (Phase 4) |
| `GET /api/admin/metrics` | 인증+어드민 → 501 (Phase 5) |

### 생성 API 요청 예시
```jsonc
// POST /api/core/generate  (Authorization: Bearer <idToken>)
{ "petId": "…", "sourceImages": ["data:image/png;base64,…"], "quality": "medium" }

// POST /api/fitting/apply
{ "coreId": "…", "apparel": ["hat_beret"], "background": "forest", "userPrompt": "가을 낙엽" }

// POST /api/virtualpet/create
{ "name": "몽이", "recipe": { "parts": ["사모예드","아기판다"], "extras": ["유니콘 뿔"] } }

// POST /api/image/delete
{ "collection": "generations", "id": "…" }
```
> 참조 이미지는 `sourceImages`(base64) 또는 `sourcePaths`(본인 `uploads/{uid}/…` Storage 경로).
> 실패 시 선차감 크레딧 자동 환불. 프롬프트 유해/IP 표현은 400 거부(sanitize).

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

## Phase 2 완료 상태 (핵심 생성 루프)
- GPT Image 2 클라이언트([openai.ts](src/lib/server/openai.ts)): `generations`(신규)·`edits`(참조합성)
- 프롬프트 오케스트레이션([prompt.ts](src/lib/prompt.ts)): sanitize, 코어/피팅(anchor 레이어링·배경)/가상펫 빌더
- 자동 저장: 생성 PNG → Storage + Firestore 메타(`coreImages`/`generations`/`pets`) 기록
- 소프트 삭제: `status:'trashed'` (하드 삭제는 배치 전용)
- 모든 생성 경로에 cost-guardian 사전검사·commitCost 원가 로깅 연동

> ⚠️ 실제 생성은 OpenAI 유료 호출이 발생. 04 문서대로 **edit 실단가는 파일럿 로깅으로 확정** 필요.

## Phase 3 완료 상태 (피드 & 마이페이지)
- 홈 = 피드([feed-client](src/app/[locale]/feed-client.tsx)): 공개 작품 2열 매소너리, 필터칩, 빈 상태 히어로+CTA
- 촬영 플로우([create](src/app/[locale]/create/create-client.tsx)): 펫 등록+사진 업로드→코어 생성→결과
- 피팅룸([fitting/[coreId]](src/app/[locale]/fitting/[coreId]/fitting-client.tsx)): 코어 선택(피드 '입혀보기'는 내 코어 고르기)+배경/아이템/문구→합성→피드 공개 토글
- 실험실([explore](src/app/[locale]/explore/explore-client.tsx)): 가상 펫 생성
- 마이 스튜디오([studio](src/app/[locale]/studio/studio-client.tsx)): 크레딧·마이펫·코어·작품 + 소프트 삭제
- SNS 공유([share-button](src/components/share-button.tsx)): Web Share API/링크 복사/다운로드
- 원본 업로드 → `uploads/{uid}/` (Storage), 생성물 `imageUrl`(토큰 URL)로 피드 표시

> 데이터 조회는 클라이언트 Firestore(보안규칙 허용 read), 생성/삭제는 서버 API(토큰 첨부).
> 실제 화면 검증은 로그인(Firebase 웹키) 필요.

## Phase 4 완료 상태 (굿즈 & 커머스 — 목업)
- 굿즈 카탈로그([goods.ts](src/lib/goods.ts)): 탁상/벽걸이 달력·액자·폰케이스(필요 이미지·판매가·비율)
- 컬렉션([collection](src/app/[locale]/collection/collection-client.tsx)): 내 작품 선택 → 굿즈 선택 → 목업 미리보기 + 원가표시 → 주문(cart)
- `/api/goods/preview`: 기존 룩을 코어에 **high 세로 재생성**(인쇄 해상도, 가드+commitCost)
- `/api/goods/order`: 소유권 검증 후 `orders` 문서 생성(status:'cart', 인쇄단가 null)
- 목업 프레임([goods-mockup](src/components/goods-mockup.tsx)): 폰케이스/액자/달력

> ⚠️ 인쇄 제휴 단가 [알 수 없음] → 결제·배송·굿즈 마진은 제휴 확정 후. 현재는 장바구니(cart)까지 목업.
> 굿즈 판매가는 [가정](05 §3). 어드민 굿즈/어패럴 CRUD 는 Phase 5.

## Phase 5 완료 상태 (어드민 & 지표)
- 접근제어: `requireAdmin`(role 서버 재검증), `/api/admin/bootstrap`(ADMIN_EMAIL 자기승격)
- 지표([/api/admin/metrics](src/app/api/admin/metrics/route.ts)): 가입/등급분포·총생성·**원가 실시간 누계**(월/전체)·kill switch %
- 설정([config](src/app/api/admin/config/route.ts)): 기본품질·등급한도·총액상한·환율 GET/PUT
- 회원([users](src/app/api/admin/users/route.ts)): 목록 + 등급/역할/크레딧 조정
- 어패럴 CRUD([apparel](src/app/api/admin/apparel/route.ts)): 카탈로그 upsert/삭제 → 피팅룸에서 사용
- 대시보드 UI([admin](src/app/[locale]/admin/admin-client.tsx)): 마이 스튜디오에 어드민 링크(role==admin)

### 최초 어드민 만들기
1. `.env.local` 의 `ADMIN_EMAIL` 을 본인 계정으로 설정(기본: 프로젝트 오너)
2. 로그인 후 `/ko/admin` 접속 → "ADMIN_EMAIL 이면 승격" 클릭 → 대시보드 진입

## MVP 전체 완료 (Phase 0~5)
빌드 순서(`ORCHESTRATOR.md §4`)의 5개 페이즈 전부 구현. 남은 항목은 문서상 [알 수 없음]:
- 굿즈 인쇄 제휴 단가 → 결제·배송·굿즈 실마진(현재 목업)
- edit 실단가(1.8x 가정) → 1주 파일럿 로깅으로 확정
- rate limit·재시도 정책 값 → 파일럿 후
