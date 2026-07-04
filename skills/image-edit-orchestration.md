# SKILL: image-edit-orchestration

> 사용 주체: image-gen-agent · 참조: 04_IMAGE_GENERATION.md
> 목적: 코어 이미지에 어패럴/배경을 "생물학적·과학적으로 자연스럽게" 합성하는 프롬프트 조립 규칙.

## 언제 쓰나
- 가상 피팅룸에서 어패럴/액세서리 장착, 배경 변경, 유저 텍스트 반영 시.

## 핵심 개념: anchor(착장 부위)
각 어패럴은 anchor를 가짐: `head` / `neck` / `body` / `face` / `paw` / `prop`.

## 조립 규칙
1. **부위 충돌 방지**: 같은 anchor 중복 장착 시 나중 것으로 교체(모자 위 모자 금지).
2. **레이어 순서**(뒤→앞): body → neck → head → face → prop.
3. **해부학 일관성 문구 필수**:
   `"fitted naturally to the {species}'s {anchor}, correct proportions, not floating,
    consistent lighting and perspective with the subject, seamless blend"`.
4. **코어 identity 보존**:
   `"preserve the pet's face, fur color, markings, and body shape exactly"`.
5. **배경 조각**:
   `"set against a {background} scene, natural depth of field, lighting matched to the pet"`.
6. **유저 텍스트**: sanitize 후 말미에 append. 금지어(실존 인물/저작권 IP/유해) 필터.

## 프롬프트 템플릿(예)
```
Base image: {coreImage}
Edit: dress the pet with {apparelFragments in layer order},
preserve the pet's face, fur color, markings, and body shape exactly;
each item fitted naturally to the correct body part, correct proportions,
not floating, consistent lighting and perspective;
{backgroundFragment}; {sanitizedUserPrompt}.
Studio-quality, photorealistic.
```

## 품질/비용
- 미리보기: medium. 굿즈 확정: high(세로형 권장).
- edit는 참조 이미지 입력 비용이 추가됨 → 호출마다 실비용 로깅.

## 실패/보정
- identity 흔들림(얼굴·무늬 변형) 감지 시 재생성 유도.
- 재생성은 비용 발생 → 무료 재시도 횟수 정책 준수(cost-guardian).

## 확인 필요 [확실하지 않음]
- 실제 합성 품질은 모델 테스트 전 보장 불가. 프롬프트는 출발점, 파일럿으로 튜닝.
