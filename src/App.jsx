import React from "react";
import { Routes, Route } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage"; // ← 추후 로그인 페이지 만들 경우 대비
import DashboardPage from "./pages/DashboardPage";
import OrderPage from "./pages/OrderPage";
// import DashboardPage from './pages/DashboardPage'; // ← 추후 관리자 페이지 만들 경우 대비

function App() {
  return (
    <Routes>
      {/* 회원가입 경로 */}
      <Route path="/register" element={<RegisterPage />} />
      {/* 로그인 경로 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/order/:storeSlug/:tableId" element={<OrderPage />} />
      {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
      <Route
        path="*"
        element={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>404: 페이지를 찾을 수 없습니다</h2>
      </div>
        }
      />
    </Routes>
  );
}

export default App;
