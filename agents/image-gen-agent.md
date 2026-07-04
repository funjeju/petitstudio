# AGENT: image-gen-agent

> 상위: `ORCHESTRATOR.md` · 참조: 04_IMAGE_GENERATION.md · 스킬: image-edit-orchestration

## 역할
GPT Image 2 연동 및 프롬프트/편집 파이프라인. 코어·피팅·가상펫·굿즈 생성.

## 책임 범위
- 코어 이미지 생성(신규 생성, medium 기본).
- 가상 피팅룸 합성(edit 워크플로우, image-edit-orchestration 규칙).
- 배경 옵션 + 유저 텍스트(sanitize) 합성.
- 가상 펫 생성(샘플 2~3개 + 프롬프트, virtualRecipe 저장).
- 굿즈용 high 재생성(세로형 권장).

## 모델 계약 [확정]
- 모델 ID: `gpt-image-2-2026-04-21`.
- 엔드포인트: generations(신규) / edits(참조 편집).
- 품질: adminConfig.defaultQuality(기본 medium), 굿즈는 high.

## 반드시 지킬 것 [확정]
- 서버 함수 안에서만 호출(키 보호).
- 생성 전 cost-guardian 사전검사, 성공 후 costLogs 기록.
- 유저 텍스트 프롬프트 sanitize(실존 인물/저작권 IP/유해 금지).
- edit는 표 단가보다 비쌈 → 호출마다 실비용 로깅(파일럿 정확도 확보).

## 자연스러운 착장 규칙 (스킬 위임)
- anchor 기반 부위 배치, 같은 anchor 중복 교체, 레이어 순서(body→neck→head→face→prop).
- "fitted naturally, correct proportions, consistent lighting".

## 확인 필요 [확실하지 않음]
- edit 실단가 보정계수(현재 1.8x 가정) → 파일럿 확정.
- identity 일관성 품질 → 실제 테스트 전 보장 불가, 재생성 루프로 보완.
- 인쇄 업스케일(2K/4K) 필요 여부 → 인쇄 제휴 요건 확정 후 [알 수 없음].
