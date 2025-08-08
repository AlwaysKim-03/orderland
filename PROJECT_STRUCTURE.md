# 프로젝트 구조 가이드

## 📁 프로젝트 구조

```
store-owner-web/                    # 메인 프로젝트 루트
├── 📱 store-owner-app/            # React Native 앱 (모바일)
│   ├── app/                       # 앱 메인 컴포넌트
│   ├── components/                # 앱 전용 컴포넌트
│   └── ...
├── 🌐 src/                        # 웹사이트 (React + Vite)
│   ├── pages/                     # 웹 페이지들
│   ├── components/                # 웹 전용 컴포넌트
│   └── ...
└── 📚 참조 저장소들
    ├── lovable-repo/              # 디자인 참조용
    ├── lovable-repo-2/            # 디자인 참조용
    └── temp-order-desktop-6/      # 설정 페이지 참조용
```

## 🎯 명확한 분리 가이드

### 📱 **앱 (React Native)**
- **위치**: `store-owner-app/`
- **기술**: React Native + Expo
- **스타일링**: StyleSheet + NativeWind
- **아이콘**: Expo Vector Icons
- **주요 파일들**:
  - `store-owner-app/app/OwnerDashboard.js`
  - `store-owner-app/app/components/MenuManager.js`
  - `store-owner-app/app/components/OrderList.js`
  - `store-owner-app/app/components/SalesInfo.js`
  - `store-owner-app/app/components/StoreInfoForm.js`

### 🌐 **웹사이트 (React)**
- **위치**: `src/`
- **기술**: React + Vite + TypeScript
- **스타일링**: Tailwind CSS + Shadcn UI
- **아이콘**: Lucide React
- **주요 파일들**:
  - `src/pages/AdminMenuPage.tsx`
  - `src/pages/OrderStatus.tsx`
  - `src/pages/AdminSettingsPage.tsx`
  - `src/pages/AdminDashboard.tsx`

## ⚠️ 주의사항

### 🔴 **절대 하지 말아야 할 것**
1. **앱 파일을 웹에서 수정하지 말 것**
   - `store-owner-app/` 폴더의 파일은 앱 전용
   - 웹에서 앱 컴포넌트를 import하지 말 것

2. **웹 파일을 앱에서 수정하지 말 것**
   - `src/` 폴더의 파일은 웹 전용
   - 앱에서 웹 컴포넌트를 import하지 말 것

3. **혼동 방지**
   - 작업 전 항상 현재 작업 대상 확인
   - 파일 경로를 꼼꼼히 확인

### 🟢 **올바른 작업 방법**

#### 앱 작업 시:
```bash
# 앱 관련 파일만 수정
store-owner-app/app/components/MenuManager.js
store-owner-app/app/OwnerDashboard.js
```

#### 웹 작업 시:
```bash
# 웹 관련 파일만 수정
src/pages/AdminMenuPage.tsx
src/pages/AdminSettingsPage.tsx
```

## 📋 작업 체크리스트

### 앱 작업 전 확인사항:
- [ ] 파일 경로가 `store-owner-app/`로 시작하는지 확인
- [ ] React Native 컴포넌트인지 확인
- [ ] StyleSheet 사용하는지 확인
- [ ] Expo Vector Icons 사용하는지 확인

### 웹 작업 전 확인사항:
- [ ] 파일 경로가 `src/`로 시작하는지 확인
- [ ] TypeScript 파일(.tsx)인지 확인
- [ ] Tailwind CSS 클래스 사용하는지 확인
- [ ] Shadcn UI 컴포넌트 사용하는지 확인
- [ ] Lucide React 아이콘 사용하는지 확인

## 🔄 최근 변경사항

### 웹사이트 (src/)
- ✅ `AdminSettingsPage.tsx`: GitHub 저장소의 고급 설정 페이지 적용
- ✅ `AdminMenuPage.tsx`: Firebase 백엔드 연동 유지
- ✅ `OrderStatus.tsx`: 주문 현황 페이지

### 앱 (store-owner-app/)
- ✅ `MenuManager.js`: Lovable 디자인 적용
- ✅ `OwnerDashboard.js`: 대시보드 업데이트
- ✅ `OrderList.js`: 주문 목록 컴포넌트
- ✅ `SalesInfo.js`: 매출 정보 컴포넌트
- ✅ `StoreInfoForm.js`: 매장 정보 폼

## 🚀 다음 작업 시 주의사항

1. **작업 대상 명확히 하기**
   - "웹페이지 수정" vs "앱 수정" 구분
   - 파일 경로 먼저 확인

2. **기술 스택 확인**
   - 웹: React + TypeScript + Tailwind
   - 앱: React Native + JavaScript + StyleSheet

3. **컴포넌트 라이브러리 확인**
   - 웹: Shadcn UI + Lucide React
   - 앱: React Native 기본 + Expo Vector Icons

## 📞 문제 발생 시

혼동이 생기면 이 문서를 다시 확인하고:
1. 현재 작업 대상이 웹인지 앱인지 명확히 하기
2. 파일 경로 확인
3. 기술 스택 확인
4. 필요시 팀원과 상의

---

**💡 팁**: 작업 시작 전에 항상 "지금 웹을 수정하는 건가, 앱을 수정하는 건가?"를 먼저 확인하세요! 