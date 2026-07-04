# SKILL: firestore-schema-guard

> 사용 주체: backend-agent · 참조: 03_DATA_MODEL.md
> 목적: 스키마 일관성·보안 규칙 위반 방지.

## 언제 쓰나
- Firestore 컬렉션/필드 생성·수정 시.
- 보안 규칙 작성/변경 시.

## 필수 검증 항목
1. **서버 전용 필드 write 차단**(클라이언트 write 금지):
   - `users.tier`, `users.role`, `users.credits.*`
   - `*.costUsd`, `costLogs.*`, `adminConfig.*`
2. **소유권 규칙**: 유저는 `ownerUid == auth.uid` 문서만 read/write.
3. **소프트 삭제**: 삭제는 `status: "trashed"` 업데이트만. 하드 delete는 서버 배치만.
4. **필수 필드 존재**: 각 컬렉션 스키마(03 문서)의 필수 필드 누락 금지.
5. **신규 필드/컬렉션**: 추가 시 03 문서 갱신 필수(문서-코드 동기화).

## 보안 규칙 스켈레톤(예)
```
match /users/{uid} {
  allow read: if request.auth.uid == uid;
  // tier/role/credits 는 클라이언트 write 금지 → admin SDK만
  allow update: if request.auth.uid == uid
    && !request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['tier','role','credits']);
}
match /generations/{id} {
  allow read: if resource.data.shared == true
    || request.auth.uid == resource.data.ownerUid;
  allow write: if request.auth.uid == request.resource.data.ownerUid;
}
match /costLogs/{id}   { allow read, write: if false; } // 서버(admin)만
match /adminConfig/{d} { allow read: if true; allow write: if false; } // 서버만
```

## 체크리스트(변경 전)
- [ ] 서버 전용 필드에 클라이언트 write 경로가 없는가?
- [ ] ownerUid 검사가 있는가?
- [ ] 하드 delete를 클라이언트가 못 하는가?
- [ ] 03 문서를 갱신했는가?

## 주의 [확실하지 않음]
- 복합 인덱스는 실제 쿼리 확정 후 생성(피드/마이스튜디오 정렬).
