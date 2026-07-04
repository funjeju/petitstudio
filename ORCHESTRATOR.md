# ORCHESTRATOR — petit studio (가칭)

> 반려동물 AI 스튜디오 + 가상 피팅룸 + 굿즈 전환 서비스
> 이 문서는 프로젝트 전체를 조율하는 최상위 지침서입니다. 모든 서브에이전트와 스킬은 이 문서의 순서와 규칙을 따릅니다.

---

## 0. 이 문서의 역할

- 프로젝트의 **단일 진실 공급원(single source of truth)**의 진입점.
- 어떤 작업을 할 때 **어떤 문서를 읽고, 어떤 에이전트를 호출하고, 어떤 스킬을 적용할지** 정의.
- 문서 간 충돌이 있으면 이 문서 > `/docs` 상세 문서 > 개별 에이전트 순으로 우선.

### 표기 규칙 (사용자 기본 지침 반영)
- **[확정]** — 근거를 갖고 확정된 사항.
- **[가정]** — 합리적 가정. 실제 값 확인 시 교체 필요.
- **[확실하지 않음]** — 검증 전이라 단정 불가. 파일럿/견적으로 확정.
- **[알 수 없음]** — 현재 정보로 판단 불가. 외부 확인 필요.

---

## 1. 제품 한 줄 정의 [확정]

반려동물(또는 가상 펫) 사진을 업로드하면 AI가 스튜디오 촬영 수준의 **코어 이미지**를 생성하고,
유저가 **가상 피팅룸**에서 어패럴·액세서리를 입혀보며 배경을 바꿔 착장 컬렉션을 만들고,
그 결과물을 **달력·액자·폰케이스 등 실물 굿즈**로 전환하는 모바일 우선(웹 대응) 서비스.

핵심 차별점 3가지:
1. 1회성 이미지 판매가 아니라 **코어 이미지를 재사용 자산화** → 액세서리·시즌 추가마다 재방문.
2. **'입혀보기' = 구매 전 단계**, 굿즈/펫용품 커머스로 자연 연결.
3. 생성 이미지 **무조건 자동 저장**(유저 명시 삭제 전까지 보존) → 비용 든 자산 보호.

---

## 2. 확정 사항 (Fixed Decisions)

| 항목 | 결정 | 상태 |
|---|---|---|
| 디자인 컨셉 | 시안 3번 **PAWFOLIO (모던 & 미니멀, 화이트+그레이)** | [확정] |
| 프론트/호스팅 | Next.js (App Router) on **Vercel** | [확정] |
| 백엔드 | **Firebase** (Auth / Firestore / Storage) + 서버 함수(Vercel API Route 또는 Firebase Functions) | [확정] |
| 로그인 | **Google 로그인** (Firebase Auth) | [확정] |
| 이미지 생성 | **GPT Image 2** (`gpt-image-2-2026-04-21`) | [확정] |
| 품질 티어 | 유저 기본값 **medium**, 어드민에서 low/medium/high 변경 가능 | [확정] |
| 키 보호 | OpenAI 키는 **서버 환경변수에만**(`NEXT_PUBLIC_` 금지). 클라이언트 직접 호출 금지 | [확정] |
| 등급 | 비회원 / 무료 / Pro / VIP (4단계) | [확정] |
| 다국어 | 18개 언어 (i18n) | [확정] |
| 테마 | 다크 / 라이트 토글 | [확정] |
| 자동 저장 | 모든 생성 이미지(코어 포함) 자동 저장, 소프트 삭제만 허용 | [확정] |
| 공유 | 모든 생성물 SNS 퍼가기 버튼 | [확정] |

---

## 3. 산출물 파일 맵

```
petit-studio/
├── ORCHESTRATOR.md              ← (이 문서) 최상위 조율
├── docs/
│   ├── 01_PRD.md                ← 제품 요구사항 정의
│   ├── 02_ARCHITECTURE.md       ← 기술 아키텍처
│   ├── 03_DATA_MODEL.md         ← Firestore/Storage 스키마
│   ├── 04_IMAGE_GENERATION.md   ← GPT Image 2 연동/피팅/가상펫 로직
│   ├── 05_COST_AND_TIERS.md     ← 원가표·등급·구독료·굿즈 원가
│   ├── 06_FEATURES.md           ← 기능 상세(피팅룸/마이페이지/공유/i18n/테마)
│   ├── 07_ADMIN_DASHBOARD.md    ← 어드민 + 투자용 지표
│   └── DESIGN.md                ← 시안 3번 디자인 시스템 정의
├── agents/
│   ├── frontend-agent.md
│   ├── backend-agent.md
│   ├── image-gen-agent.md
│   ├── cost-guardian-agent.md
│   ├── admin-agent.md
│   └── i18n-agent.md
└── skills/
    ├── image-edit-orchestration.md
    ├── cost-calculator.md
    ├── firestore-schema-guard.md
    └── goods-mockup.md
```

---

## 4. 빌드 순서 (Phase)

의존성 때문에 아래 순서를 지킵니다. 앞 단계가 문서로 확정되기 전 뒤 단계 코드 착수 금지.

### Phase 0 — 기반
1. `02_ARCHITECTURE.md` 확정 → 레포/Vercel/Firebase 프로젝트 셋업.
2. `03_DATA_MODEL.md` 확정 → Firestore 컬렉션·보안 규칙·Storage 버킷.
3. `DESIGN.md` 확정 → 디자인 토큰·컴포넌트 기본.

### Phase 1 — 인증 & 골격
4. Google 로그인 (backend-agent + frontend-agent).
5. 등급/크레딧 카운터 스키마 반영 (cost-guardian-agent).
6. 다크/라이트 토글 + i18n 스캐폴딩 (i18n-agent).

### Phase 2 — 핵심 생성 루프
7. 코어 이미지 생성 (image-gen-agent, 서버 함수 경유).
8. 가상 피팅룸(어패럴/배경 합성, edit 워크플로우).
9. 가상 펫 생성.
10. 자동 저장 + 소프트 삭제.

### Phase 3 — 피드 & 마이페이지
11. 피드 홈(2열), 필터, '내 아이에게 입혀보기'.
12. 마이 스튜디오(마이펫/코어/생성물 피드/어패럴 관리).
13. SNS 공유.

### Phase 4 — 굿즈 & 커머스
14. 굿즈 미리보기(생성원가 계산 연동) + 주문.
15. 인쇄 제휴 연동 — **[알 수 없음] 제휴 단가 확정 전 목업만.**

### Phase 5 — 어드민 & 지표
16. 어드민 대시보드(회원/데이터 관리).
17. 투자용 지표 로그(원가 실시간 누계 포함).

---

## 5. 에이전트 호출 규칙

| 작업 유형 | 담당 에이전트 | 필수 참조 문서 | 적용 스킬 |
|---|---|---|---|
| UI/화면 구현 | frontend-agent | DESIGN.md, 06_FEATURES.md | — |
| API/서버 함수/DB | backend-agent | 02, 03 | firestore-schema-guard |
| 이미지 생성/편집 | image-gen-agent | 04 | image-edit-orchestration |
| 사용량·원가 통제 | cost-guardian-agent | 05 | cost-calculator |
| 어드민/지표 | admin-agent | 07, 05 | cost-calculator |
| 다국어 | i18n-agent | 06 | — |
| 굿즈 원가/미리보기 | frontend + cost-guardian | 05 | goods-mockup, cost-calculator |

**공통 규칙**
- 돈이 나가는 모든 경로(이미지 생성)는 반드시 `cost-guardian-agent`의 사전 검사 통과 후 실행.
- 스키마를 만지는 작업은 반드시 `firestore-schema-guard` 스킬로 검증.
- 어떤 에이전트도 OpenAI 키를 클라이언트 번들에 노출하지 않는다. (위반 시 즉시 중단)

---

## 6. 미해결/확인 필요 항목 (Open Questions)

| # | 항목 | 상태 | 해결 방법 |
|---|---|---|---|
| 1 | 피팅룸 edit 워크플로우 실단가 | [확실하지 않음] | 1주 파일럿, 모든 호출 비용 로깅 |
| 2 | 굿즈 인쇄 제휴 단가 | [알 수 없음] | 국내 인쇄사(퍼블로그/레드프린팅 등) 실견적 |
| 3 | USD/KRW 환율 | [가정] 1,450원 | 결제 시점 환율 반영 로직 필요 |
| 4 | 피드 2열 vs 1열 몰입형 | [확실하지 않음] | 출시 후 A/B 테스트 |
| 5 | 무료 티어 손실 흡수 한도 | [가정] | 전환율 데이터 확보 후 조정 |
| 6 | 가상펫/합성 이미지 저작권·정책 | [확실하지 않음] | 법률 검토 필요 |

---

## 7. 근거 자료 (출처)

- GPT Image 2 단가: OpenAI 공식 계산기 예시값. 교차검증 출처 —
  - CostGoat: https://costgoat.com/pricing/openai-images
  - YingTu(한국어): https://yingtu.ai/ko/blog/gpt-image-2-cost-per-image
  - The Decoder: https://the-decoder.com/openais-chatgpt-images-2-0-thinks-before-it-generates-adding-reasoning-and-web-search-to-image-creation/
  - 모델 ID/출시일: gpt-image-2-2026-04-21, 2026-04-21 출시, API 유료계정 전용.
- 시장 배경(개인화 굿즈/팬덤/반려동물 시장): `05_COST_AND_TIERS.md` 하단 참조 목록.
