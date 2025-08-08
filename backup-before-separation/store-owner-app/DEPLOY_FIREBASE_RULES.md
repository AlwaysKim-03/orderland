# Firebase 보안 규칙 배포 가이드

## 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

## 2. Firebase에 로그인

```bash
firebase login
```

## 3. 프로젝트 초기화 (이미 되어있다면 생략)

```bash
firebase init
```

## 4. 보안 규칙 배포

### Firestore 규칙 배포
```bash
firebase deploy --only firestore:rules
```

### Storage 규칙 배포
```bash
firebase deploy --only storage
```

### 인덱스 배포
```bash
firebase deploy --only firestore:indexes
```

### 모든 규칙 한번에 배포
```bash
firebase deploy --only firestore,storage
```

## 5. 규칙 테스트

배포 후 앱에서 다음 기능들이 정상 작동하는지 확인:

- [ ] 로그인/회원가입
- [ ] 가게 정보 수정
- [ ] 메뉴 추가/수정/삭제
- [ ] 카테고리 관리
- [ ] 주문 조회
- [ ] 매출 정보 조회
- [ ] 이미지 업로드

## 6. 문제 해결

### 권한 오류가 발생하는 경우:

1. **Firebase Console에서 규칙 확인**
   - https://console.firebase.google.com/project/store-owner-web/firestore/rules

2. **인증 상태 확인**
   - 앱에서 로그인이 제대로 되어있는지 확인

3. **데이터 구조 확인**
   - `storeId` 필드가 올바르게 설정되어 있는지 확인

4. **인덱스 생성 확인**
   - 복합 쿼리 오류가 발생하면 인덱스가 생성될 때까지 대기 (최대 1-2분)

### 로그 확인 방법:

```bash
# Firebase CLI 로그 확인
firebase functions:log

# 실시간 로그 모니터링
firebase functions:log --tail
```

## 7. 보안 규칙 설명

### Firestore 규칙:
- 인증된 사용자만 데이터 접근 가능
- 사용자는 자신의 `storeId`와 일치하는 데이터만 접근 가능
- 새 문서 생성 시 `storeId`가 현재 사용자의 UID와 일치해야 함

### Storage 규칙:
- 인증된 사용자만 파일 업로드/다운로드 가능
- 이미지 파일만 업로드 가능 (5MB 이하)
- 상품 이미지는 모든 인증된 사용자가 읽기 가능

## 8. 추가 보안 설정

### Google Cloud Console에서 추가 설정:
1. https://console.cloud.google.com/apis/credentials
2. API 키 제한 설정
3. 허용된 앱 도메인 설정

### Firebase Console에서 추가 설정:
1. Authentication > Sign-in method
2. 이메일/비밀번호 인증 활성화
3. 앱 도메인 허용 목록 설정 