# 사업자 인증 기능 가이드

이 기능은 **활성화되어 있습니다**.

## 구현된 기능:

### 1. 서버리스 함수 (Vercel)
- `api/business-verification.js` - 사업자 인증 API
- `api/business-verification-status.js` - 인증 상태 확인 API

### 2. 프론트엔드 API
- `src/api/business-verification.js` - 사업자 인증 관련 API 함수들
- 유효성 검사 함수들 포함

### 3. UI 컴포넌트
- `src/components/BusinessVerificationModal.jsx` - 사업자 인증 모달
- 회원가입 페이지에 4단계로 통합
- 대시보드에 인증 상태 표시

### 4. 데이터베이스
- Firestore: 사용자 정보에 사업자 인증 데이터 저장
- Supabase: 사업자 인증 기록 저장 (서버리스 함수용)

## 사용 방법:

### 1. 환경변수 설정
```bash
# .env 파일에 추가
NTS_API_KEY=your_nts_api_key
VERCEL_SUPABASE_URL=your_supabase_url
VERCEL_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. 국세청 오픈API 키 발급
1. [국세청 오픈API](https://www.data.go.kr/data/15081808/openapi.do) 접속
2. 신청 및 승인 후 API 키 발급
3. 환경변수에 설정

### 3. Supabase 설정
1. Supabase 프로젝트 생성
2. `business_verifications` 테이블 생성:
```sql
CREATE TABLE business_verifications (
  id SERIAL PRIMARY KEY,
  businessNumber VARCHAR(10) UNIQUE NOT NULL,
  openingDate DATE NOT NULL,
  representativeName VARCHAR(50) NOT NULL,
  businessName VARCHAR(100) NOT NULL,
  verifiedAt TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'verified',
  userId VARCHAR(100),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## 기능 특징:

### ✅ 구현 완료
- 국세청 오픈API 연동
- 실시간 유효성 검사
- 회원가입 단계별 통합
- 대시보드 인증 상태 표시
- 인증 정보 Firestore 저장
- 모바일 반응형 UI

### 🔄 사용 흐름
1. 회원가입 시 4단계에서 사업자 인증 선택
2. 사업자번호, 개업일자, 대표자명, 상호명 입력
3. 국세청 API로 실시간 검증
4. 인증 성공 시 사용자 정보에 저장
5. 대시보드에서 인증 상태 확인 가능

### 🛡️ 보안
- 서버리스 함수로 API 키 보호
- 입력값 유효성 검사
- CORS 설정
- 에러 핸들링

## 테스트 방법:
1. 개발 서버 실행: `npm run dev`
2. 회원가입 페이지에서 사업자 인증 테스트
3. 대시보드에서 인증 상태 확인

---
**참고**: 실제 국세청 API 키가 필요하며, 테스트 시에는 실제 사업자 정보를 사용해야 합니다. 