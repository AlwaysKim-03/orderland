import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";
import OrderPage from "./pages/OrderPage";
import ReservationPage from "./pages/ReservationPage";
import './index.css';

// 로그인 상태를 체크하는 훅
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}

// 로그인 상태에 따라 컴포넌트를 보호하는 래퍼
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // 로딩 중에는 아무것도 렌더링하지 않거나 로딩 스피너를 보여줄 수 있습니다.
    return <div>Loading...</div>; 
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/:storeSlug/:tableId" element={<OrderPage />} />
        <Route path="/:storeSlug" element={<OrderPage />} />
        <Route path="/:storeSlug/reservation" element={<ReservationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
