# 04. 이미지 생성 로직 (GPT Image 2)

> 상위: `ORCHESTRATOR.md` · 담당: image-gen-agent · 스킬: image-edit-orchestration

---

## 1. 모델 정보 [확정]

- 모델: **GPT Image 2**, 스냅샷 ID `gpt-image-2-2026-04-21`.
- 출시: 2026-04-21. API는 유료 계정 전용(무료 티어 미지원).
- 엔드포인트: `v1/images/generations`(신규 생성), `v1/images/edits`(참조 이미지 편집), `v1/responses`.
- 품질 티어: low / medium / high. 유저 기본값 **medium**, 어드민에서 변경.
- 출처: OpenAI 공식 계산기 예시값, 교차검증(CostGoat, YingTu, The Decoder). ORCHESTRATOR §7 참조.

### 단가 (1024×1024, 출력 예시) [확정]
| 품질 | 단가(USD) |
|---|---|
| low | $0.006 |
| medium | $0.053 |
| high | $0.211 |

세로형(1024×1536)은 medium $0.041 / high $0.165로 더 저렴 → 굿즈(세로 인쇄물)는 세로형 권장.

### 중요 경고 [확실하지 않음]
- **edit 요청(참조 이미지 포함)은 입력 이미지를 quality 설정과 무관하게 최고 품질로 처리** → 표 단가보다 비쌈.
- 우리 피팅룸은 코어에 어패럴을 얹는 **edit 워크플로우**이므로 실단가는 표값보다 높음.
- 재시도(마음에 안 들어 재생성)도 비용에 합산됨.
- → 실단가는 **파일럿 로깅으로만 확정 가능**. 05 문서는 보정계수 1.8x [가정]로 계산.

## 2. 생성 파이프라인

### 2.1 코어 이미지 생성 (신규 생성)
```
입력: 유저 펫 사진 3장(권장) + 종/품종 메타
프롬프트: "professional pet studio portrait, {breed}, soft studio lighting,
           neutral seamless backdrop, sharp focus, high detail, centered"
품질: medium(기본)
출력: coreImages/{uid}/{coreId}.png (정사각 1024)
저장: 자동 (03 문서)
```
- identity 일관성이 핵심. 여러 각도 사진을 참조로 넣어 얼굴/무늬 특징 고정.
- 100% 일관성 보장 불가 → "다시 촬영" 버튼(재생성)으로 보완. [확실하지 않음]

### 2.2 가상 피팅룸 (edit 워크플로우)
```
입력: 코어 이미지 + 선택한 어패럴[] + 배경 옵션 + 유저 텍스트
방식: v1/images/edits (코어를 base로, 어패럴을 프롬프트로 합성)
프롬프트 조립: image-edit-orchestration 스킬 규칙 따름
품질: medium(미리보기), 굿즈 확정 시 high로 재생성
```

#### 자연스러운 착장 규칙 (image-edit-orchestration 스킬 상세)
- 각 어패럴은 **anchor(착장 부위)** 를 가짐: head / neck / body / face / paw / prop.
- 부위 충돌 방지: 같은 anchor 중복 장착 시 나중 것으로 교체(모자 위 모자 금지).
- 해부학적 자연스러움: "fitted naturally to the {species}'s {anchor}, correct proportions,
  not floating, consistent lighting with the subject".
- 레이어 순서: body → neck → head → face → prop (뒤 레이어가 앞에 그려짐).

### 2.3 배경 옵션 [확정]
- 프리셋: 바다(sea) / 숲(forest) / 도시(city) / 거실(living_room) + 유저 텍스트 입력.
- 프롬프트 조각: `"set against a {background} scene, natural depth of field,
  lighting consistent with the pet"`.
- 유저 텍스트는 sanitize 후 프롬프트에 append (프롬프트 인젝션/부적절 표현 필터).

### 2.4 가상 펫 생성 [확정]
```
입력: 2~3개 동물/전설 캐릭터 샘플 이미지 업로드 + 프롬프트 설명
예: "사모예드 + 아기판다 + (유니콘 뿔)" → 세상에 없지만 실제처럼
방식: 샘플을 참조 입력 + 텍스트 합성 프롬프트
프롬프트: "a photorealistic imaginary pet blending {A}, {B}, {C};
           coherent single creature, believable anatomy, studio portrait"
저장: pets/{petId}.isVirtual=true, virtualRecipe에 레시피 보관(재생성용)
```
- 생성 후에는 실제 펫과 동일하게 코어化 → 피팅룸/굿즈 파이프라인 재사용.
- 정책 주의: 실존 인물/저작권 캐릭터 합성 금지 필터 필요. [확실하지 않음 — 법률 검토]

### 2.5 굿즈용 재생성 [확정]
- 미리보기는 medium, **굿즈 주문 확정 시 high(세로형 권장)로 재생성** → 인쇄 해상도 확보.
- 굿즈 1개 생성 시마다 이미지 생성원가 발생(사용자 명시 요구). 05 문서 원가 반영.

## 3. 비용 통제 연동 [확정]
- 모든 생성 호출 전 cost-guardian-agent 사전검사(등급 잔량 + 월 총액).
- 생성 성공 후에만 크레딧 차감 + costLogs 기록(실패한 호출은 차감 안 함, 단 실패도 일부 비용 발생 가능 → 로그).

## 4. 프롬프트 보안 [확정]
- 유저 텍스트 입력은 항상 sanitize.
- 금지: 실존 인물, 저작권 캐릭터/IP, 부적절/유해 콘텐츠.
- 위반 시 생성 거부 + 사유 안내.

## 5. 미확정 [확실하지 않음]
- edit 실단가 보정계수(현재 1.8x 가정) → 파일럿으로 확정.
- 재시도 무료 허용 횟수(품질 불만 시) → 원가 영향 크므로 정책 필요.
- 인쇄용 업스케일 필요 여부(2K/4K) → 인쇄 제휴 해상도 요건 확정 후. [알 수 없음]
