import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { OrderNotificationProvider } from "./contexts/OrderNotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useToast } from "./hooks/use-toast";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminSalesPage from "./pages/AdminSalesPage";
import AdminReservationsPage from "./pages/AdminReservationsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import OrderPage from "./pages/OrderPage";
import CartPage from "./pages/CartPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

const queryClient = new QueryClient();

// 로딩 컴포넌트
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    </div>
  );
}

// 로그인 상태에 따라 컴포넌트를 보호하는 래퍼
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// 관리자 세션을 확인하는 래퍼
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminSession = () => {
      try {
        const adminSession = localStorage.getItem('orderland-admin-session');
        
        if (!adminSession) {
          navigate("/login", { replace: true });
          return;
        }

        const sessionData = JSON.parse(adminSession);
        const now = new Date();
        const expiresAt = new Date(sessionData.expiresAt);

        if (now > expiresAt) {
          localStorage.removeItem('orderland-admin-session');
          navigate("/login", { replace: true });
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Admin session check error:', error);
        navigate("/login", { replace: true });
      }
    };

    checkAdminSession();
  }, [navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

// 홈 페이지에서 인증 상태에 따라 리다이렉트하는 컴포넌트
function HomeRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (user) {
    return <Navigate to="/admin" replace />;
  }
  
  return <Index />;
}

// 로그인 페이지에서 인증 상태에 따라 리다이렉트하는 컴포넌트
function LoginRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (user) {
    return <Navigate to="/admin" replace />;
  }
  
  return <LoginPage />;
}

// 회원가입 페이지에서 인증 상태에 따라 리다이렉트하는 컴포넌트
function RegisterRedirect() {
  const { user, loading, isRegistering } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  // 회원가입 중이거나 사용자가 없으면 회원가입 페이지 표시
  if (isRegistering || !user) {
    return <RegisterPage />;
  }
  
  // 이미 로그인된 사용자는 관리자 페이지로 리다이렉트
  return <Navigate to="/admin" replace />;
}

const App = () => {
  const { toast } = useToast();

  // 비활성화 알림 확인
  useEffect(() => {
    const checkDeactivationAlert = () => {
      const isDeactivated = localStorage.getItem('account-deactivated');
      const deactivationTime = localStorage.getItem('deactivation-time');
      
      if (isDeactivated === 'true' && deactivationTime) {
        const deactivationDate = new Date(deactivationTime);
        const now = new Date();
        const timeDiff = now.getTime() - deactivationDate.getTime();
        
        // 1시간 이내의 비활성화 알림만 표시
        if (timeDiff < 60 * 60 * 1000) {
          toast({
            title: "계정 비활성화",
            description: "계정이 비활성화되어 로그아웃되었습니다. 관리자에게 문의하세요.",
            variant: "destructive",
          });
          
          // 알림 표시 후 로컬 스토리지 정리
          localStorage.removeItem('account-deactivated');
          localStorage.removeItem('deactivation-time');
        }
      }
    };

    // 페이지 로드 시 확인
    checkDeactivationAlert();
    
    // 주기적으로 확인 (5분마다)
    const interval = setInterval(checkDeactivationAlert, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <OrderNotificationProvider>
        <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/login" element={<LoginRedirect />} />
              <Route path="/register" element={<RegisterRedirect />} />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute>
                  <AdminOrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/menu" element={
                <ProtectedRoute>
                  <AdminMenuPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/sales" element={
                <ProtectedRoute>
                  <AdminSalesPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/reservations" element={
                <ProtectedRoute>
                  <AdminReservationsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute>
                  <AdminSettingsPage />
                </ProtectedRoute>
              } />
              
              {/* Super Admin Route */}
              <Route path="/super-admin" element={
                <AdminProtectedRoute>
                  <SuperAdminDashboard />
                </AdminProtectedRoute>
              } />
              
              <Route path="/order" element={<OrderPage />} />
              <Route path="/order/:storeName/:tableNumber" element={<OrderPage />} />
              <Route path="/order/:storeName/:tableNumber/cart" element={<CartPage />} />
              <Route path="/order/:storeName/:tableNumber/order-history" element={<OrderHistoryPage />} />
              <Route path="/store/:storeId/table/:tableId" element={<OrderPage />} />
              <Route path="/store/:storeId/table/:tableId/cart" element={<CartPage />} />
              <Route path="/store/:storeId/table/:tableId/order-history" element={<OrderHistoryPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </ThemeProvider>
      </OrderNotificationProvider>
    </QueryClientProvider>
  );
};

export default App;
