import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";
import OrderPage from "./pages/OrderPage";
// import HomePage from "@/pages/HomePage"; // 메인 페이지
// import DashboardPage from './pages/DashboardPage'; // ← 추후 관리자 페이지 만들 경우 대비

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/order/:storeSlug/:tableId" element={<OrderPage />} />
        <Route path="/order/:storeSlug" element={<OrderPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
