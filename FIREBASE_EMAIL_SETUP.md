# Firebase 이메일 인증 설정 가이드 (배포 환경)

## 🎯 목표
배포 환경(`store-owner-web.vercel.app`)에서 이메일 인증이 제대로 작동하도록 설정

## 🔧 Firebase 콘솔 설정 (필수)

### 1. Authentication > Sign-in method 설정

1. [Firebase 콘솔](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: `store-owner-web`
3. **Authentication** > **Sign-in method** 이동
4. **이메일/비밀번호** 활성화:
   - ✅ **이메일/비밀번호** 체크
   - ✅ **이메일 인증** 체크
   - **저장**

### 2. Authentication > Templates 설정

1. **Authentication** > **Templates** 이동
2. **이메일 인증** 템플릿 선택
3. 템플릿 커스터마이징:
   ```
   제목: [Order.Land] 이메일 주소를 확인해주세요
   내용: 
   안녕하세요!
   
   Order.Land 회원가입을 완료하려면 아래 링크를 클릭하여 이메일 주소를 확인해주세요.
   
   [이메일 주소 확인]
   
   이 링크는 1시간 후에 만료됩니다.
   
   감사합니다.
   Order.Land 팀
   ```
4. **저장**

### 3. Authentication > Settings > Authorized domains

1. **Authentication** > **Settings** 이동
2. **Authorized domains** 섹션에서 다음 도메인들 추가:
   - ✅ `localhost` (개발용)
   - ✅ `store-owner-web.vercel.app` (배포용)
   - ✅ `vercel.app` (Vercel 도메인)
   - ✅ `vercel.com` (Vercel 도메인)

### 4. Authentication > Settings > Action URL

1. **Action URL** 섹션에서:
   - **이메일 인증 후 리다이렉트 URL**: `https://store-owner-web.vercel.app/login`
   - **비밀번호 재설정 후 리다이렉트 URL**: `https://store-owner-web.vercel.app/login`

## 🚀 배포 환경 테스트

### 1. 배포 확인
```bash
# Vercel에 배포
git add .
git commit -m "Fix email verification for production"
git push origin main
```

### 2. 배포 URL에서 테스트
1. `https://store-owner-web.vercel.app/register` 접속
2. 회원가입 진행
3. 이메일 인증 메일 발송
4. 실제 이메일 확인

### 3. 이메일 확인 방법
- **받은 편지함** 확인
- **스팸 메일함** 확인
- **프로모션 탭** 확인 (Gmail)
- **휴지통** 확인

## 🔍 문제 해결

### 이메일이 오지 않는 경우

#### 1. Firebase 설정 확인
```bash
# 브라우저 콘솔에서 확인
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});
```

#### 2. 네트워크 요청 확인
- 브라우저 개발자 도구 > Network 탭
- Firebase API 요청 확인
- 오류 코드 확인

#### 3. Firebase 콘솔 로그 확인
- **Authentication** > **Users**에서 사용자 상태 확인
- **Functions** > **Logs**에서 서버 로그 확인

### 일반적인 오류 코드

| 오류 코드 | 의미 | 해결 방법 |
|-----------|------|-----------|
| `auth/invalid-email` | 잘못된 이메일 형식 | 이메일 주소 확인 |
| `auth/email-already-in-use` | 이미 사용 중인 이메일 | 다른 이메일 사용 |
| `auth/too-many-requests` | 요청 한도 초과 | 잠시 후 재시도 |
| `auth/network-request-failed` | 네트워크 오류 | 인터넷 연결 확인 |

## 📧 이메일 인증 흐름

### 1. 회원가입 과정
```
사용자 입력 → Firebase 계정 생성 → 이메일 인증 메일 발송 → 사용자 이메일 확인 → 인증 완료
```

### 2. 인증 확인 과정
```
사용자 이메일 클릭 → Firebase 인증 → 로그인 페이지 리다이렉트 → 회원가입 완료
```

## 🛡️ 보안 설정

### 1. 도메인 제한
- Authorized domains에 허용된 도메인만 추가
- 불필요한 도메인 제거

### 2. 이메일 템플릿 보안
- 스팸 필터를 피하기 위한 적절한 제목과 내용
- 브랜드 일관성 유지

### 3. 요청 제한
- Firebase 무료 플랜: 하루 10,000건
- 과도한 요청 방지

## 📱 모바일 대응

### 1. 모바일 이메일 앱
- Gmail, Outlook, Apple Mail 등 지원
- 모바일 브라우저에서 이메일 클릭 시 앱 실행

### 2. 딥링크 설정
- Firebase 콘솔에서 모바일 앱 설정
- iOS/Android 앱 연동 (필요시)

## 🔄 업데이트 내역

### v1.0.0 (현재)
- ✅ 실제 Firebase 이메일 인증 구현
- ✅ 배포 환경 대응
- ✅ 에러 처리 개선
- ✅ 사용자 경험 개선

### 향후 계획
- [ ] 이메일 템플릿 다국어 지원
- [ ] 인증 메일 재발송 기능
- [ ] 이메일 인증 상태 실시간 업데이트

## 📞 지원

문제가 지속되면:
1. Firebase 콘솔 설정 재확인
2. 브라우저 개발자 도구 로그 확인
3. 네트워크 요청 상태 확인
4. 이메일 서비스 설정 확인 