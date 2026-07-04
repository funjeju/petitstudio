# 02. 기술 아키텍처

> 상위: `ORCHESTRATOR.md` · 담당: backend-agent, frontend-agent

---

## 1. 스택 개요 [확정]

| 레이어 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | Next.js (App Router) + React | 모바일 우선, 반응형 |
| 호스팅 | Vercel | 프론트 + 서버리스 함수 |
| 인증 | Firebase Auth (Google 로그인) | |
| DB | Firebase Firestore | 유저/펫/이미지/주문/사용량 |
| 파일 저장 | Firebase Storage | 원본 업로드 + 생성 이미지 |
| 이미지 생성 | OpenAI GPT Image 2 API | 서버 함수에서만 호출 |
| i18n | next-intl 또는 next-i18next | 18개 언어 (i18n-agent 참조) |
| 상태관리 | React state + 서버 캐시 | 과설계 지양 |

## 2. 요청 흐름 (이미지 생성)

```
[브라우저(클라이언트)]
    │  "코어 이미지 생성" / "어패럴 입히기" 요청 (유저 인증 토큰 포함)
    ▼
[Vercel 서버 함수  /api/generate  또는 Firebase Functions]
    │  1. Firebase Auth 토큰 검증 (누구인가)
    │  2. Firestore에서 등급·잔여 크레딧 조회 (cost-guardian)
    │  3. 잔량 없으면 402/거절 → 결제 유도
    │  4. 월 총액 kill switch 확인
    │  5. OpenAI GPT Image 2 호출 (키는 서버 env)
    │  6. 결과 → Firebase Storage 저장 + Firestore 메타 기록(자동저장)
    │  7. 크레딧 원자적 차감(트랜잭션) + 원가 로그 기록
    ▼
[브라우저]  ← 생성 이미지 URL 반환
```

### 왜 서버 함수 경유인가 [확정]
1. **키 보호**: OpenAI 키는 서버 env에만. `NEXT_PUBLIC_` 접두어 금지 → 브라우저 번들 미포함.
2. **정책 집행**: 등급별 사용량 검사·차감은 서버에서만 신뢰 가능(클라이언트 카운터는 위조 가능).
3. **비용 방어**: rate limit + 월 총액 상한을 서버에서 강제.

> 참고: 키를 Vercel 환경변수(비-public)에 두고 API Route에서 호출하는 방식은 이미 올바른 서버 경유 구조임. 본 문서는 그 위에 "등급 차감/총액 상한" 정책 레이어를 추가하는 것이 핵심.

## 3. 환경변수 [확정]

| 변수 | 위치 | 노출 |
|---|---|---|
| `OPENAI_API_KEY` | Vercel (서버) | ❌ 절대 노출 금지 (NEXT_PUBLIC 금지) |
| `FIREBASE_ADMIN_*` | Vercel (서버) | ❌ 서버 전용 |
| `NEXT_PUBLIC_FIREBASE_*` | Vercel | ✅ 공개 가능(클라이언트 SDK 설정용, 보안규칙으로 방어) |
| `MONTHLY_COST_CAP_USD` | Vercel (서버) | ❌ kill switch 임계값 |

## 4. 서버 함수 목록 (초안)

| 엔드포인트 | 역할 | 사전검사 |
|---|---|---|
| `POST /api/core/generate` | 코어 이미지 생성 | 인증+크레딧+총액 |
| `POST /api/fitting/apply` | 어패럴/배경 합성(edit) | 인증+크레딧+총액 |
| `POST /api/virtualpet/create` | 가상 펫 생성 | 인증+크레딧+총액 |
| `POST /api/goods/preview` | 굿즈용 고해상 생성 | 인증+크레딧+총액 |
| `POST /api/image/delete` | 소프트 삭제(휴지통) | 인증 |
| `GET  /api/me/usage` | 내 사용량 조회 | 인증 |
| `GET  /api/admin/metrics` | 지표 로그 | 인증+어드민 |

## 5. 보안 원칙 [확정]

- Firestore 보안 규칙: 유저는 자기 문서만 read/write. 크레딧·등급 필드는 **클라이언트 write 금지**(서버 admin SDK만).
- rate limit: 유저별 분당 요청 상한(자동화 공격 방어). [가정] 값은 파일럿 후 확정.
- 월 총액 kill switch: 누적 API 비용 > `MONTHLY_COST_CAP_USD` 시 생성 차단.

## 6. 반응형 전략 [확정]

- 컴포넌트는 모바일 기준 설계 → 웹은 최대폭 컨테이너 + 그리드 열 수 증가로 대응.
- 브레이크포인트/토큰은 `DESIGN.md`.
- 하단 탭바(모바일) ↔ 좌측 사이드바(웹)로 네비게이션 전환.

## 7. 미확정 [확실하지 않음]
- 서버 함수를 Vercel API Route로 통일할지, 무거운 이미지 작업만 Firebase Functions로 분리할지 — 부하 테스트 후 결정.
- 이미지 후처리(업스케일/워터마크) 필요 여부 — 굿즈 인쇄 해상도 요건 확정 후.
