# 아임포트 결제 시스템 설정 가이드

## 1. 아임포트 계정 설정

1. [아임포트 관리자 페이지](https://admin.iamport.kr/)에서 계정을 생성합니다.
2. 가맹점 식별코드(imp_code)를 발급받습니다.
3. PG사 설정을 완료합니다 (이니시스, 토스페이먼츠 등).

## 2. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가합니다:

```env
# 아임포트 설정
REACT_APP_IAMPORT_IMP_CODE=your_imp_code_here
REACT_APP_IAMPORT_PG=html5_inicis

# Firebase 설정 (이미 설정되어 있을 수 있음)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

## 3. 테스트 결제

### 개발 환경에서 테스트
- 현재 설정은 테스트 모드로 되어 있습니다.
- 테스트 카드 번호: 4242-4242-4242-4242
- 만료일: 아무 미래 날짜
- CVC: 아무 3자리 숫자

### 실제 결제 테스트
1. 아임포트 관리자 페이지에서 실제 가맹점 식별코드를 발급받습니다.
2. `.env` 파일의 `REACT_APP_IAMPORT_IMP_CODE`를 실제 코드로 변경합니다.
3. PG사 설정을 완료합니다.

## 4. 결제 플로우

1. 고객이 메뉴를 선택하고 장바구니에 담습니다.
2. 장바구니에서 "주문하기" 버튼을 클릭합니다.
3. 결제 모달이 열리고 주문 내역을 확인합니다.
4. "결제하기" 버튼을 클릭하면 아임포트 결제창이 열립니다.
5. 결제가 완료되면 주문이 자동으로 저장됩니다.

## 5. 주의사항

- 실제 운영 환경에서는 HTTPS가 필요합니다.
- 결제 정보는 Firestore에 안전하게 저장됩니다.
- 결제 실패 시 적절한 에러 메시지가 표시됩니다.

## 6. 추가 기능

- 결제 내역 조회
- 환불 처리
- 결제 통계

이러한 기능들은 필요에 따라 추가 구현할 수 있습니다. 