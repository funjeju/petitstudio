# 03. 데이터 모델 (Firestore / Storage)

> 상위: `ORCHESTRATOR.md` · 담당: backend-agent · 검증: firestore-schema-guard 스킬

---

## 1. 설계 원칙 [확정]

- 크레딧·등급·원가 관련 필드는 **서버(admin SDK)만 write**. 클라이언트 write 금지.
- 생성 이미지 메타는 자동 저장. 삭제는 `status: "trashed"`로 소프트 삭제.
- 함께 갱신되는 데이터는 같은 문서에 묶어 쓰기 횟수 최소화.

## 2. 컬렉션 구조

### `users/{uid}`
```jsonc
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "photoURL": "string",
  "tier": "free | pro | vip",        // 서버만 write
  "locale": "ko | en | ja | ...",     // 18개 중 하나
  "theme": "light | dark | system",
  "createdAt": "timestamp",
  "role": "user | admin",            // 서버만 write
  "credits": {                        // 서버만 write
    "period": "2026-07",             // 정산 주기(YYYY-MM)
    "limit": 20,                      // 이번 주기 허용 생성 수(등급 반영)
    "used": 3,                        // 사용량
    "trialUsed": true                 // 비회원/무료 체험 소진 여부
  }
}
```

### `pets/{petId}`  (마이펫)
```jsonc
{
  "petId": "string",
  "ownerUid": "string",
  "name": "초코",
  "species": "dog | cat | other | virtual",
  "breed": "말티푸",
  "birthday": "timestamp | null",     // 생일 기준 시작월 달력용
  "adoptedAt": "timestamp | null",    // 입양일 기준 달력용
  "isVirtual": false,                 // 가상 펫 여부
  "virtualRecipe": null,              // 가상 펫이면 합성 레시피(04 참조)
  "createdAt": "timestamp"
}
```

### `coreImages/{coreId}`  (코어 이미지 = 재사용 자산)
```jsonc
{
  "coreId": "string",
  "ownerUid": "string",
  "petId": "string",
  "storagePath": "coreImages/{uid}/{coreId}.png",
  "imageUrl": "https://firebasestorage.../...?token=",  // 표시용 다운로드 토큰 URL
  "quality": "medium",                // 생성 시 티어
  "costUsd": 0.095,                    // 이 생성에 든 실비용(로그)
  "status": "active | trashed",
  "createdAt": "timestamp"
}
```

### `generations/{genId}`  (착장/합성 결과 = 피드 단위)
```jsonc
{
  "genId": "string",
  "ownerUid": "string",
  "petId": "string",
  "coreId": "string",                 // 어떤 코어에서 파생됐는지
  "type": "fitting | virtualpet | goods",
  "apparel": ["hat_beret", "scarf_wool"],  // 장착 어패럴 id 목록
  "background": "forest",             // 배경 옵션 id
  "userPrompt": "가을 낙엽 배경",       // 유저 텍스트 옵션
  "storagePath": "generations/{uid}/{genId}.png",
  "imageUrl": "https://firebasestorage.../...?token=",  // 표시용(피드 공개 이미지도 이 URL로 노출)
  "quality": "medium | high",
  "costUsd": 0.095,
  "status": "active | trashed",
  "shared": false,                    // 피드 공개 여부(옵트인)
  "likes": 0,
  "createdAt": "timestamp"
}
```

### `apparel/{apparelId}`  (어패럴/액세서리 카탈로그 — 운영/어드민 관리)
```jsonc
{
  "apparelId": "hat_beret",
  "category": "hat | outfit | accessory | season | prop",
  "nameI18n": { "ko": "베레모", "en": "Beret", "...": "..." },
  "anchor": "head",                   // 착장 부위(자연스러운 합성용, 04 참조)
  "promptFragment": "wearing a wool beret, ...",  // 생성 프롬프트 조각
  "season": "autumn | null",
  "active": true
}
```

### `goods/{goodsId}`  (굿즈 상품 정의 — 어드민 관리)
```jsonc
{
  "goodsId": "calendar_desk",
  "nameI18n": { "ko": "탁상 달력", "en": "Desk calendar", "...": "..." },
  "genCostUsd": 0.165,                // 굿즈 1개당 이미지 생성원가(high)
  "printCostKrw": null,               // [알 수 없음] 인쇄 제휴 단가 미정
  "priceKrw": 19000,                  // 판매가(가정)
  "requiredImages": 12,               // 달력=12장 등
  "active": true
}
```

### `orders/{orderId}`  (주문)
```jsonc
{
  "orderId": "string",
  "ownerUid": "string",
  "goodsId": "calendar_desk",
  "genIds": ["...12개..."],
  "amountKrw": 19000,
  "genCostUsd": 1.98,                 // 이미지 생성 원가 합
  "printCostKrw": null,               // [알 수 없음]
  "status": "cart | paid | printing | shipped",
  "createdAt": "timestamp"
}
```

### `costLogs/{logId}`  (원가 로그 — 투자 지표/총액 상한)
```jsonc
{
  "logId": "string",
  "uid": "string",
  "endpoint": "fitting.apply",
  "model": "gpt-image-2-2026-04-21",
  "quality": "medium",
  "costUsd": 0.095,
  "period": "2026-07",
  "createdAt": "timestamp"
}
```

### `costTotals/{period}`  (월 총액 누계 — kill switch 기준, 서버 전용)
```jsonc
{
  "period": "2026-07",                // 문서 ID = 정산 주기(YYYY-MM)
  "costUsd": 123.45,                  // 이번 달 누적 API 비용(commitCost 시 increment)
  "count": 1560                       // 이번 달 생성 건수
}
```
> costLogs 를 매 요청 집계하면 비싸므로 누계 문서를 원자적 증가(FieldValue.increment)로 유지.
> checkAndReserve 가 이 값과 adminConfig.monthlyCostCapUsd 를 비교해 생성 차단.

### `adminConfig/global`  (어드민 전역 설정)
```jsonc
{
  "defaultQuality": "medium",         // 어드민이 조정
  "monthlyCostCapUsd": 500,           // kill switch
  "tierLimits": { "free": 5, "pro": 20, "vip": 50 },  // 05 문서와 동기화
  "usdKrw": 1450                      // [가정] 환율
}
```

## 3. Storage 구조
```
uploads/{uid}/{uploadId}.jpg          // 원본 업로드(가공 전)
coreImages/{uid}/{coreId}.png         // 코어 이미지
generations/{uid}/{genId}.png         // 착장/합성 결과
trash/{uid}/...                        // 소프트 삭제 후 유예 보관
```

## 4. 소프트 삭제 규칙 [확정]
- 유저가 삭제 → `status: "trashed"` + Storage는 `trash/`로 이동(또는 플래그만).
- 유예 기간(예: 30일 [가정]) 후 배치로 하드 삭제.
- 비용이 든 자산이므로 **즉시 하드 삭제 금지**.

## 5. 인덱스/쿼리 [가정]
- 피드: `generations` where `shared==true` and `status=="active"` orderBy `createdAt desc`.
- 마이 스튜디오: `generations` where `ownerUid==uid` and `status=="active"`.
- 복합 인덱스 필요 — 실제 쿼리 확정 후 생성.

## 6. 검증 규칙 (firestore-schema-guard 적용)
- 크레딧/등급/role/costUsd 필드에 클라이언트 write 시도 → 거부.
- 신규 컬렉션/필드 추가 시 이 문서 갱신 필수.
