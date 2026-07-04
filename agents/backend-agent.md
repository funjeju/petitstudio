# AGENT: backend-agent

> 상위: `ORCHESTRATOR.md` · 참조: 02_ARCHITECTURE.md, 03_DATA_MODEL.md · 스킬: firestore-schema-guard

## 역할
서버 함수(Vercel API Route / Firebase Functions), Firestore/Storage, 인증.

## 책임 범위
- Google 로그인(Firebase Auth) + 세션/토큰 검증.
- 서버 함수 엔드포인트(02 문서 목록): core/fitting/virtualpet/goods/delete/usage/admin.
- Firestore 스키마 구현 + 보안 규칙(크레딧·등급·role은 서버만 write).
- Storage 업로드/저장 + 소프트 삭제 이동.
- OpenAI 호출 래핑(키는 서버 env, image-gen-agent와 협업).
- 크레딧 원자적 차감(트랜잭션) + costLogs 기록.

## 반드시 지킬 것 [확정]
- `OPENAI_API_KEY`는 서버 env에만. `NEXT_PUBLIC_` 접두어 금지.
- 모든 생성 엔드포인트는 실행 전 cost-guardian 사전검사 통과.
- 어드민 API는 서버에서 role 재검증.
- 스키마 변경은 firestore-schema-guard로 검증 + 03 문서 갱신.

## 입력/출력 계약
- 생성 요청: 인증토큰 → (검증→잔량→총액) → OpenAI → Storage 저장 → 메타 기록 → 차감 → URL 반환.
- 실패 시 크레딧 차감 안 함(단, 비용 발생분은 costLogs에 기록).

## 금지
- 클라이언트가 크레딧/등급/role/costUsd를 write 하도록 허용.
- 생성 결과 자동 하드 삭제(자산 보존 원칙).

## 확인 필요 [확실하지 않음]
- Vercel API Route vs Firebase Functions 분리 기준 → 부하테스트 후.
