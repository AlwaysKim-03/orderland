import React, { useState, useEffect, useCallback } from 'react';
import StoreInfoTab from './dashboard/StoreInfoTab';
import OrderTab from './dashboard/OrderTab';
import SalesTab from './dashboard/SalesTab';
import MenuTab from './dashboard/MenuTab';
import ReservationsTab from './dashboard/ReservationsTab';
import OrderManagePage from './dashboard/OrderManagePage';
import BusinessVerificationModal from '../components/BusinessVerificationModal';
import { AdminLayout } from '../components/layout/AdminLayout';
import OrdersSection from '../components/dashboard/OrdersSection';
import { ReservationsSection } from '../components/dashboard/ReservationsSection';
import { StatisticsCards } from '../components/dashboard/StatisticsCards';
import { PopularMenuSection } from '../components/dashboard/PopularMenuSection';
import AdminReservationPage from '../components/admin/AdminReservationPage';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch, getDocs, deleteDoc, orderBy } from "firebase/firestore";
import { signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { 
  Home, 
  ShoppingCart, 
  Menu as MenuIcon, 
  TrendingUp, 
  Calendar, 
  Settings,
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  Trash2,
  Key
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('lastTab');
    return saved || 'admin';
  });

  // 페이지 제목 설정
  useEffect(() => {
    document.title = '오더랜드 - 관리자';
  }, []);

  useEffect(() => {
    localStorage.setItem('lastTab', activeTab);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('lastTab', tab);
  };
  const [orders, setOrders] = useState([]);
  const [callRequests, setCallRequests] = useState([]);
  const [restaurantName, setRestaurantName] = useState('맛있는 우리집 식당');
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [showBusinessVerification, setShowBusinessVerification] = useState(false);

  // --- 모든 탭의 데이터를 관리하는 상태 ---
  const [userInfo, setUserInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 데이터 로딩 함수들 ---
  const fetchAllData = useCallback(async (user) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. 유저 정보 (가게 정보 포함)
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserInfo(userData);
        setRestaurantName(userData.store_name || '맛있는 우리집 식당');
      }

      // 2. 카테고리
      const catQuery = query(collection(db, "categories"), where("storeId", "==", user.uid), orderBy("createdAt"));
      const catSnapshot = await getDocs(catQuery);
      const fetchedCategories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(fetchedCategories);
      
      // 3. 상품
      const prodQuery = query(collection(db, "products"), where("storeId", "==", user.uid));
      const prodSnapshot = await getDocs(prodQuery);
      const fetchedProducts = prodSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(fetchedProducts);

    } catch (error) {
      console.error("초기 데이터 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 실시간 리스너 설정 ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        fetchAllData(user); // 데이터 한번에 불러오기

        // 실시간 주문/호출 리스너 설정
        const unsubOrders = onSnapshot(query(collection(db, "orders"), where("storeId", "==", user.uid)), (snapshot) => {
          setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubCalls = onSnapshot(query(collection(db, "staff_calls"), where("storeId", "==", user.uid), where("status", "==", "new")), (snapshot) => {
          setCallRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 컴포넌트 언마운트 시 리스너 해제
        return () => {
          unsubOrders();
          unsubCalls();
        };
      } else {
        // 로그아웃 시 상태 초기화
        setCurrentUser(null);
        setUserInfo(null);
        setOrders([]);
        setCallRequests([]);
        setCategories([]);
        setProducts([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [fetchAllData]);

  // --- 데이터 수동 리프레시 함수 ---
  const refreshStoreInfo = useCallback(() => {
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.uid);
      getDoc(userDocRef).then(userDocSnap => {
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserInfo(userData);
          setRestaurantName(userData.store_name || '맛있는 우리집 식당');
        }
      });
    }
  }, [currentUser]);

  const refreshMenuData = useCallback(async () => {
    if (currentUser) {
      const catQuery = query(collection(db, "categories"), where("storeId", "==", currentUser.uid), orderBy("createdAt"));
      const catSnapshot = await getDocs(catQuery);
      setCategories(catSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      const prodQuery = query(collection(db, "products"), where("storeId", "==", currentUser.uid));
      const prodSnapshot = await getDocs(prodQuery);
      setProducts(prodSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  }, [currentUser]);

  // --- 데이터 및 계정 삭제 로직 (보안 강화) ---
  const handleResetData = async (password) => {
    if (!currentUser) return;
    if (!password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      if (!window.confirm("인증 성공. 정말로 모든 가게 정보를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        return;
      }

      const collectionsToDelete = ['products', 'categories', 'orders', 'staff_calls', 'sales_summary', 'businessVerifications'];
      const batch = writeBatch(db);

      for (const coll of collectionsToDelete) {
        const q = query(collection(db, coll), where("storeId", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();

      // 사업자 인증 정보도 함께 삭제
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { 
        store_name: '맛있는 우리집 식당', 
        tableCount: 0,
        // 사업자 인증 정보 삭제
        businessVerified: false,
        businessNumber: null,
        businessName: null,
        representativeName: null,
        openingDate: null,
        verifiedAt: null
      });
      
      alert('모든 데이터가 성공적으로 초기화되었습니다.');
      setIsDeleteModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("데이터 초기화 실패: ", error);
      if (error.code === 'auth/wrong-password') {
        alert("비밀번호가 일치하지 않습니다.");
      } else if (error.code === 'auth/too-many-requests') {
        alert("너무 많은 로그인 시도를 하셨습니다. 잠시 후 다시 시도해주세요.");
      } else {
        alert("데이터 초기화에 실패했습니다. " + error.message);
      }
    }
  };

  const handleDeleteAccount = async (password) => {
    if (!currentUser) return;
    if (!password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      if (!window.confirm("인증 성공. 정말로 계정을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        return;
      }

      // 모든 데이터 삭제
      const collectionsToDelete = ['products', 'categories', 'orders', 'staff_calls', 'sales_summary', 'businessVerifications'];
      const batch = writeBatch(db);

      for (const coll of collectionsToDelete) {
        const q = query(collection(db, coll), where("storeId", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();

      // 유저 문서 삭제
      await deleteDoc(doc(db, "users", currentUser.uid));
      
      // 계정 삭제
      await deleteUser(currentUser);
      
      alert('계정이 성공적으로 삭제되었습니다.');
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("계정 삭제 실패: ", error);
      if (error.code === 'auth/wrong-password') {
        alert("비밀번호가 일치하지 않습니다.");
      } else if (error.code === 'auth/too-many-requests') {
        alert("너무 많은 로그인 시도를 하셨습니다. 잠시 후 다시 시도해주세요.");
      } else {
        alert("계정 삭제에 실패했습니다. " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("로그아웃 실패: ", error);
    }
  };

  const handleAcknowledgeCall = async (callId) => {
    try {
      await updateDoc(doc(db, "staff_calls", callId), { status: "acknowledged" });
    } catch (error) {
      console.error("호출 확인 실패: ", error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (pwNew !== pwNew2) {
      setPwMsg("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    
    if (pwNew.length < 6) {
      setPwMsg("새 비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, pwCurrent);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, pwNew);
      
      setPwMsg("비밀번호가 성공적으로 변경되었습니다.");
      setPwCurrent("");
      setPwNew("");
      setPwNew2("");
      setShowPwChange(false);
    } catch (error) {
      console.error("비밀번호 변경 실패: ", error);
      if (error.code === 'auth/wrong-password') {
        setPwMsg("현재 비밀번호가 일치하지 않습니다.");
      } else if (error.code === 'auth/too-many-requests') {
        setPwMsg("너무 많은 시도를 하셨습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setPwMsg("비밀번호 변경에 실패했습니다. " + error.message);
      }
    }
  };

  const handleBusinessVerificationSuccess = (verificationData) => {
    setShowBusinessVerification(false);
    refreshStoreInfo();
    alert('사업자 인증이 성공적으로 완료되었습니다!');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'admin':
        return <AdminDashboard orders={orders} userInfo={userInfo} />;
      case 'orders':
        return <OrderTab orders={orders} userInfo={userInfo} />;
      case 'menu':
        return <MenuTab categories={categories} products={products} refreshMenuData={refreshMenuData} userInfo={userInfo} />;
      case 'sales':
        return <SalesTab userInfo={userInfo} />;
      case 'reservation':
        return <ReservationsTab userInfo={userInfo} />;
      case 'settings':
        return <StoreInfoTab userInfo={userInfo} refreshStoreInfo={refreshStoreInfo} />;
      default:
        return <AdminDashboard orders={orders} userInfo={userInfo} />;
    }
  };

  const AdminDashboard = ({ orders, userInfo }) => {
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt?.toDate?.() || order.createdAt);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    });

    // 실제 주문 데이터를 바탕으로 매출 계산
    const totalSales = todayOrders.reduce((sum, order) => {
      // 주문 데이터 구조에 따라 items 또는 orders 필드 사용
      let items = [];
      if (order.items && Array.isArray(order.items)) {
        items = order.items;
      } else if (order.orders && Array.isArray(order.orders)) {
        items = order.orders;
      } else if (typeof order.orders === 'string') {
        try {
          items = JSON.parse(order.orders);
        } catch (e) {
          console.error('주문 데이터 파싱 실패:', e);
        }
      }
      
      return sum + items.reduce((s, item) => s + (item.price * item.quantity), 0);
    }, 0);

    const totalOrders = todayOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return (
      <div className="p-6 space-y-8">
        {/* 통계 카드 */}
        <StatisticsCards 
          todayOrders={todayOrders} 
          totalSales={totalSales} 
          avgSales={avgOrderValue} 
        />

        {/* 메인 콘텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 주문 현황 (2/3) */}
          <div className="lg:col-span-2">
            <OrdersSection orders={orders} userInfo={userInfo} />
          </div>

          {/* 오른쪽: 인기 메뉴 (1/3) */}
              <div>
            <PopularMenuSection orders={todayOrders} />
          </div>
        </div>

        {/* 예약 현황 */}
            <ReservationsSection userInfo={userInfo} />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="main-content">
          <div className="content">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-500">로딩 중...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 사이드바 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Home size={20} />
          </div>
          <div className="sidebar-brand">
            <div className="sidebar-brand-name">오더랜드</div>
            <div className="sidebar-brand-desc">주문 관리 서비스</div>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="sidebar-menu-title">메뉴</div>
          
          <div 
            className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            <div className="sidebar-item-icon">
              <Home size={16} />
            </div>
            관리자페이지
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            <div className="sidebar-item-icon">
              <ShoppingCart size={16} />
            </div>
            주문 현황
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => handleTabChange('menu')}
          >
            <div className="sidebar-item-icon">
              <MenuIcon size={16} />
            </div>
            메뉴 변경
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => handleTabChange('sales')}
          >
            <div className="sidebar-item-icon">
              <TrendingUp size={16} />
            </div>
            매출 정보
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'reservation' ? 'active' : ''}`}
            onClick={() => handleTabChange('reservation')}
          >
            <div className="sidebar-item-icon">
              <Calendar size={16} />
            </div>
            예약
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <div className="sidebar-item-icon">
              <Settings size={16} />
            </div>
            설정
          </div>
        </div>

        {/* 계정 관리 */}
        <div className="sidebar-menu">
          <div className="sidebar-menu-title">계정</div>
          
          <div className="sidebar-item" onClick={() => setShowPwChange(true)}>
            <div className="sidebar-item-icon">
              <Key size={16} />
            </div>
            비밀번호 변경
          </div>

          <div className="sidebar-item" onClick={() => setIsDeleteModalOpen(true)}>
            <div className="sidebar-item-icon">
              <Trash2 size={16} />
            </div>
            계정 관리
          </div>

          <div className="sidebar-item" onClick={handleLogout}>
            <div className="sidebar-item-icon">
              <LogOut size={16} />
            </div>
            로그아웃
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {/* 헤더 */}
        <div className="header">
          <div className="header-left">
            <div className="header-title">{restaurantName}</div>
            <div className="header-subtitle">오늘도 화이팅!</div>
          </div>
          
          <div className="header-right">
            <div className="search-bar">
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                placeholder="주문, 메뉴 검색..." 
                className="search-input"
              />
            </div>
            
            <div className="notification-bell">
              <Bell size={16} />
              {callRequests.length > 0 && (
                <div className="notification-badge">{callRequests.length}</div>
              )}
            </div>
            
            <div className="user-avatar">
              <UserIcon size={16} />
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        {renderContent()}
      </div>

      {/* 모달들 */}
      {showBusinessVerification && (
        <BusinessVerificationModal
          onClose={() => setShowBusinessVerification(false)}
          onSuccess={handleBusinessVerificationSuccess}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onResetData={handleResetData}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {showPwChange && (
        <PasswordChangeModal
          onClose={() => setShowPwChange(false)}
          onSubmit={handleChangePassword}
          pwCurrent={pwCurrent}
          setPwCurrent={setPwCurrent}
          pwNew={pwNew}
          setPwNew={setPwNew}
          pwNew2={pwNew2}
          setPwNew2={setPwNew2}
          pwMsg={pwMsg}
        />
      )}
    </div>
  );
}

// Delete Modal Component
function DeleteModal({ onClose, onResetData, onDeleteAccount }) {
  const [password, setPassword] = useState("");
  const [action, setAction] = useState(""); // "reset" or "delete"

  const handleSubmit = (e) => {
    e.preventDefault();
    if (action === "reset") {
      onResetData(password);
    } else if (action === "delete") {
      onDeleteAccount(password);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">계정 관리</h3>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={() => setAction("reset")}
            className={`w-full p-3 text-left rounded-lg border ${
              action === "reset" 
                ? "border-orange-500 bg-orange-50" 
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">데이터 초기화</div>
            <div className="text-sm text-gray-600">모든 가게 정보를 초기화합니다</div>
          </button>
          
          <button
            onClick={() => setAction("delete")}
            className={`w-full p-3 text-left rounded-lg border ${
              action === "delete" 
                ? "border-red-500 bg-red-50" 
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">계정 삭제</div>
            <div className="text-sm text-gray-600">계정을 완전히 삭제합니다</div>
          </button>
        </div>

        {action && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="현재 비밀번호를 입력하세요"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
              >
                취소
              </button>
              <button
                type="submit"
                className={`btn flex-1 ${
                  action === "delete" ? "bg-red-600 hover:bg-red-700" : "btn-primary"
                }`}
              >
                {action === "reset" ? "초기화" : "삭제"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Password Change Modal Component
function PasswordChangeModal({ 
  onClose, 
  onSubmit, 
  pwCurrent, 
  setPwCurrent, 
  pwNew, 
  setPwNew, 
  pwNew2, 
  setPwNew2, 
  pwMsg 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">비밀번호 변경</h3>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              className="input"
              placeholder="현재 비밀번호를 입력하세요"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 비밀번호
            </label>
            <input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              className="input"
              placeholder="새 비밀번호를 입력하세요"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={pwNew2}
              onChange={(e) => setPwNew2(e.target.value)}
              className="input"
              placeholder="새 비밀번호를 다시 입력하세요"
              required
            />
          </div>
          
          {pwMsg && (
            <div className={`text-sm p-3 rounded-lg ${
              pwMsg.includes("성공") 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {pwMsg}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              변경
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 