# 현재 프로젝트 상태

## 📊 현재 상황 요약

### ✅ **완료된 작업**
1. **웹사이트 설정 페이지**: GitHub 저장소의 고급 설정 페이지 완전 적용
2. **앱 프론트엔드**: Lovable 디자인으로 완전 교체
3. **Firebase 연동**: 웹사이트 백엔드 유지

### 🎯 **현재 상태**

## 🌐 **웹사이트 (src/) - 완료**
- **기술**: React + TypeScript + Vite + Tailwind CSS
- **상태**: ✅ 완료
- **주요 파일들**:
  - `src/pages/AdminMenuPage.tsx` - 메뉴 관리 (Firebase 연동)
  - `src/pages/AdminSettingsPage.tsx` - 설정 페이지 (고급 탭 구조)
  - `src/pages/OrderStatus.tsx` - 주문 현황
  - `src/pages/AdminDashboard.tsx` - 대시보드

## 📱 **앱 (store-owner-app/) - 완료**
- **기술**: React Native + Expo + JavaScript
- **상태**: ✅ 완료
- **주요 파일들**:
  - `store-owner-app/app/OwnerDashboard.js` - 메인 대시보드
  - `store-owner-app/app/components/MenuManager.js` - 메뉴 관리
  - `store-owner-app/app/components/OrderList.js` - 주문 목록
  - `store-owner-app/app/components/SalesInfo.js` - 매출 정보
  - `store-owner-app/app/components/StoreInfoForm.js` - 매장 정보

## 📚 **참조 저장소들**
- `lovable-repo/` - 앱 디자인 참조용
- `lovable-repo-2/` - 웹 디자인 참조용
- `temp-order-desktop-6/` - 설정 페이지 참조용

## 🔧 **기술 스택 비교**

| 구분 | 웹사이트 | 앱 |
|------|----------|-----|
| **언어** | TypeScript | JavaScript |
| **프레임워크** | React + Vite | React Native + Expo |
| **스타일링** | Tailwind CSS + Shadcn UI | StyleSheet + NativeWind |
| **아이콘** | Lucide React | Expo Vector Icons |
| **상태관리** | React Hooks | React Hooks |
| **백엔드** | Firebase | Firebase |

## 🚨 **주의사항**

### 🔴 **절대 금지**
1. **앱 파일을 웹에서 수정하지 말 것**
   - `store-owner-app/` 폴더는 앱 전용
   - 웹에서 앱 컴포넌트 import 금지

2. **웹 파일을 앱에서 수정하지 말 것**
   - `src/` 폴더는 웹 전용
   - 앱에서 웹 컴포넌트 import 금지

3. **혼동 방지**
   - 작업 전 파일 경로 확인 필수
   - 기술 스택 확인 필수

### 🟢 **올바른 작업 방법**

#### 웹 작업 시:
```bash
# 웹 파일만 수정
src/pages/AdminMenuPage.tsx
src/pages/AdminSettingsPage.tsx
src/pages/OrderStatus.tsx
```

#### 앱 작업 시:
```bash
# 앱 파일만 수정
store-owner-app/app/OwnerDashboard.js
store-owner-app/app/components/MenuManager.js
store-owner-app/app/components/OrderList.js
```

## 📋 **작업 체크리스트**

### 웹 작업 전:
- [ ] 파일 경로가 `src/`로 시작하는지 확인
- [ ] TypeScript 파일(.tsx)인지 확인
- [ ] Tailwind CSS 클래스 사용하는지 확인
- [ ] Shadcn UI 컴포넌트 사용하는지 확인
- [ ] Lucide React 아이콘 사용하는지 확인

### 앱 작업 전:
- [ ] 파일 경로가 `store-owner-app/`로 시작하는지 확인
- [ ] JavaScript 파일(.js)인지 확인
- [ ] StyleSheet 사용하는지 확인
- [ ] Expo Vector Icons 사용하는지 확인
- [ ] React Native 컴포넌트인지 확인

## 🎯 **다음 작업 시 확인사항**

1. **작업 대상 명확히 하기**
   - "웹페이지 수정" vs "앱 수정"
   - 파일 경로 먼저 확인

2. **기술 스택 확인**
   - 웹: React + TypeScript + Tailwind
   - 앱: React Native + JavaScript + StyleSheet

3. **컴포넌트 라이브러리 확인**
   - 웹: Shadcn UI + Lucide React
   - 앱: React Native 기본 + Expo Vector Icons

## 📞 **문제 발생 시 대응**

1. **혼동 발생 시**
   - 이 문서 다시 확인
   - 파일 경로 재확인
   - 기술 스택 재확인

2. **잘못된 파일 수정 시**
   - 즉시 변경사항 되돌리기
   - 올바른 파일 경로로 재작업

3. **기술 스택 혼동 시**
   - 웹: Tailwind CSS + Shadcn UI
   - 앱: StyleSheet + React Native 기본

---

**💡 핵심**: 작업 시작 전에 항상 "지금 웹을 수정하는 건가, 앱을 수정하는 건가?"를 먼저 확인하세요! 