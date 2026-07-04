# SKILL: cost-calculator

> 사용 주체: cost-guardian-agent, admin-agent · 참조: 05_COST_AND_TIERS.md
> 목적: GPT Image 2 단가로 생성원가·등급 손익·굿즈 원가를 일관되게 계산.

## 확정 단가 (1024×1024, USD) [확정]
```
LOW=0.006  MEDIUM=0.053  HIGH=0.211
# 세로형(1024x1536): low 0.005 / medium 0.041 / high 0.165
```

## 가정값 [가정 — 실운영 전 교체]
```
USD_KRW = 1450          # 환율
EDIT_FACTOR = 1.8       # 피팅룸 edit 보정계수(참조이미지+재시도), 파일럿으로 확정
MARGIN_TARGET = 0.75    # 목표 마진(원가의 약 4배 판매)
```

## 계산 공식
```
# 1장 원가(원)
cost_krw(quality) = price_usd(quality) * USD_KRW
# 피팅룸 실단가(추정)
fitting_real = MEDIUM * EDIT_FACTOR * USD_KRW   # ≈ 138원

# 등급 월 원가
tier_cost = monthly_quota * fitting_real

# 마진 유지 최대 수량(판매가에서 역산)
max_qty(price) = price * (1 - MARGIN_TARGET) / fitting_real

# 굿즈 이미지 생성원가(high 세로)
goods_gen = HIGH_PORTRAIT(0.165) * USD_KRW * required_images
```

## 산출 결과(문서 05 반영) [가정]
- 피팅룸 실단가 ≈ 138원/장.
- 안 B(마진75%): Pro 20장/12,900원(마진 79%), VIP 50장/29,900원(마진 77%).
- 안 C(물량): Pro 60장(마진 36%), VIP 150장(마진 31%).
- 굿즈 생성원가: 달력(12장) ≈ 2,868원, 단품 ≈ 239원. 인쇄단가 [알 수 없음] 별도.

## 어드민 지표 계산
- 유저당 원가 = 유저 costLogs 합.
- 무료 손실 = 무료 생성 수 × fitting_real.
- 실효 마진 = (구독료 − 실제 원가) / 구독료.
- 원가 누계 = costLogs.costUsd 합 × USD_KRW.

## 주의 [확실하지 않음]
- 표 단가는 "출력 예시"이지 최종 청구 아님(토큰·재시도·edit로 변동).
- EDIT_FACTOR는 추정치. 파일럿 로깅으로 반드시 실측 교체.
