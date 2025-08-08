# 프로젝트 분리 완료 가이드

## ✅ **분리 완료 상태**

### 📁 **새로운 프로젝트 구조**

```
/Users/joonohlee/
├── 📱 store-owner-app-separated/    # React Native 앱 (독립 프로젝트)
├── 🌐 store-owner-web-separated/    # React 웹사이트 (독립 프로젝트)
└── 📦 store-owner-web/              # 원본 프로젝트 (백업용)
```

## 🎯 **각 프로젝트 정보**

### 📱 **앱 프로젝트** (`store-owner-app-separated/`)
- **기술**: React Native + Expo + JavaScript
- **Firebase**: ✅ 연동 완료
- **주요 파일들**:
  - `app/OwnerDashboard.js` - 메인 대시보드
  - `app/components/MenuManager.js` - 메뉴 관리
  - `app/components/OrderList.js` - 주문 목록
  - `app/components/SalesInfo.js` - 매출 정보
  - `app/components/StoreInfoForm.js` - 매장 정보

### 🌐 **웹사이트 프로젝트** (`store-owner-web-separated/`)
- **기술**: React + TypeScript + Vite + Tailwind CSS
- **Firebase**: ✅ 연동 완료
- **주요 파일들**:
  - `src/pages/AdminMenuPage.tsx` - 메뉴 관리
  - `src/pages/AdminSettingsPage.tsx` - 설정 페이지
  - `src/pages/OrderStatus.tsx` - 주문 현황
  - `src/pages/AdminDashboard.tsx` - 대시보드

## 🚀 **실행 방법**

### 앱 실행:
```bash
cd /Users/joonohlee/store-owner-app-separated
npx expo start
```

### 웹사이트 실행:
```bash
cd /Users/joonohlee/store-owner-web-separated
npm run dev
```

## 🔧 **Firebase 설정**

### 공통 Firebase 프로젝트:
- **프로젝트 ID**: `store-owner-web`
- **데이터베이스**: Firestore
- **스토리지**: Firebase Storage
- **위치**: asia-northeast3

### 각 프로젝트의 Firebase 설정:
- **앱**: `store-owner-app-separated/firebase.json` (Firestore + Storage)
- **웹**: `store-owner-web-separated/firebase.json` (Firestore + Storage + Hosting)

## 📋 **작업 가이드**

### 앱 작업 시:
```bash
cd /Users/joonohlee/store-owner-app-separated
# 앱 관련 파일만 수정
```

### 웹 작업 시:
```bash
cd /Users/joonohlee/store-owner-web-separated
# 웹 관련 파일만 수정
```

## ⚠️ **주의사항**

1. **각 프로젝트는 완전히 독립적**
   - 앱과 웹이 서로 다른 폴더에 있음
   - 혼동 가능성 제거

2. **Firebase는 공유**
   - 같은 Firebase 프로젝트 사용
   - 데이터는 실시간 동기화

3. **백업 보존**
   - 원본 프로젝트는 `store-owner-web/`에 보존
   - 문제 발생 시 복구 가능

## 🔄 **최근 변경사항**

### ✅ **완료된 작업**
- [x] 앱과 웹을 완전히 분리
- [x] Firebase 설정 유지
- [x] 각 프로젝트 독립 실행 가능
- [x] 의존성 설치 완료
- [x] 백업 생성

### 🎯 **현재 상태**
- **앱**: 독립 프로젝트로 분리 완료
- **웹**: 독립 프로젝트로 분리 완료
- **Firebase**: 양쪽 모두 정상 연동

## 📞 **문제 발생 시**

1. **실행 오류 시**
   - 각 프로젝트 폴더에서 `npm install` 재실행
   - Firebase 설정 확인

2. **Firebase 연동 오류 시**
   - `.env` 파일 확인
   - Firebase 프로젝트 설정 확인

3. **복구 필요 시**
   - 원본 프로젝트 `store-owner-web/`에서 복사

---

**💡 핵심**: 이제 앱과 웹이 완전히 분리되어 혼동 없이 작업할 수 있습니다! 