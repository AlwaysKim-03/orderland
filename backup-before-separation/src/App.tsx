import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { OrderNotificationProvider } from "./contexts/OrderNotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminSalesPage from "./pages/AdminSalesPage";
import AdminReservationsPage from "./pages/AdminReservationsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
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
