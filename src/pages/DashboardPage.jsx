import React, { useState, useEffect, useCallback } from 'react';
import StoreInfoTab from './dashboard/StoreInfoTab';
import OrderTab from './dashboard/OrderTab';
import SalesTab from './dashboard/SalesTab';
import MenuTab from './dashboard/MenuTab';
import OrderManagePage from './dashboard/OrderManagePage';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch, getDocs, deleteDoc, orderBy } from "firebase/firestore";
import { signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [orders, setOrders] = useState([]);
  const [callRequests, setCallRequests] = useState([]);
  const [restaurantName, setRestaurantName] = useState('내 매장');
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        setRestaurantName(userData.store_name || '내 매장');
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
          setRestaurantName(userData.store_name || '내 매장');
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

      const collectionsToDelete = ['products', 'categories', 'orders', 'staff_calls', 'sales_summary'];
      const batch = writeBatch(db);

      for (const coll of collectionsToDelete) {
        const q = query(collection(db, coll), where("storeId", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();

      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { store_name: '내 매장', tableCount: 0 });
      
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
    const user = auth.currentUser;
    if (!user) return;
    if (!password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      if (!window.confirm("인증 성공. 정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        return;
      }
      
      const collectionsToDelete = ['products', 'categories', 'orders', 'staff_calls', 'sales_summary'];
      const dataBatch = writeBatch(db);
      for (const coll of collectionsToDelete) {
        const q = query(collection(db, coll), where("storeId", "==", user.uid));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => dataBatch.delete(doc.ref));
      }
      await dataBatch.commit();

      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);

      alert('계정이 성공적으로 삭제되었습니다.');
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("계정 삭제 실패: ", error);
      if (error.code === 'auth/wrong-password') {
        alert("비밀번호가 일치하지 않습니다.");
      } else if (error.code === 'auth/requires-recent-login') {
        alert("계정 삭제는 보안을 위해 최근 로그인이 필요합니다. 다시 로그인한 후 시도해주세요.");
        signOut(auth);
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
      // 로그아웃 성공 후 로그인 페이지로 이동합니다.
      // 이 부분이 누락되었을 수 있습니다.
      window.location.href = '/login';
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다: " + error.message);
    }
  };

  const handleAcknowledgeCall = async (callId) => {
    try {
      const callDocRef = doc(db, "staff_calls", callId);
      await updateDoc(callDocRef, {
        status: 'acknowledged'
      });
    } catch (error) {
      console.error("직원 호출 확인 처리 실패:", error);
      alert('호출 확인 처리에 실패했습니다.');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div>데이터를 불러오는 중...</div>;
    }
    
    switch (activeTab) {
      case 'store':
        return <StoreInfoTab userInfo={userInfo} onStoreUpdate={refreshStoreInfo} />;
      case 'orders':
        return <OrderManagePage orders={orders} userInfo={userInfo} onUserUpdate={refreshStoreInfo} />;
      case 'sales':
        return <SalesTab />;
      case 'menu':
        return <MenuTab categories={categories} products={products} onMenuUpdate={refreshMenuData} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#fff', margin: 0, padding: 8, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', minHeight: '100vh', background: '#fff', margin: 0, padding: 0, boxSizing: 'border-box' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#222' }}>{restaurantName}</h2>
            <h4 style={{ margin: 0 }}>직원 호출 현황 ({callRequests.length}건)</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {callRequests.map(call => (
                <li key={call.id} style={{ marginBottom: 4, color: '#f59e42', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <span>{call.tableNumber}번 테이블 직원 호출</span>
                  <button
                    onClick={() => handleAcknowledgeCall(call.id)}
                    style={{
                      background: '#fff',
                      color: '#222',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      padding: '2px 12px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    확인
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{display: 'flex', gap: '12px'}}>
            <button onClick={() => setIsDeleteModalOpen(true)} style={{padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>계정 관리</button>
            <button onClick={handleLogout} style={{padding: '8px 16px'}}>로그아웃</button>
          </div>
        </header>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button onClick={() => setActiveTab('store')} className={activeTab === 'store' ? 'active' : ''} style={tabButtonStyle(activeTab === 'store')}>가게정보</button>
          <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''} style={tabButtonStyle(activeTab === 'orders')}>주문정보</button>
          <button onClick={() => setActiveTab('sales')} className={activeTab === 'sales' ? 'active' : ''} style={tabButtonStyle(activeTab === 'sales')}>매출정보</button>
          <button onClick={() => setActiveTab('menu')} className={activeTab === 'menu' ? 'active' : ''} style={tabButtonStyle(activeTab === 'menu')}>음식메뉴</button>
        </div>

        <div style={{ marginTop: 30 }}>
          {renderContent()}
        </div>
      </div>
      
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onResetData={handleResetData}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}

function DeleteModal({ onClose, onResetData, onDeleteAccount }) {
  const [password, setPassword] = useState('');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>계정 관리</h3>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '15px', lineHeight: 1.6 }}>
          데이터를 초기화하거나 계정을 삭제하려면, 보안을 위해 현재 계정의 비밀번호를 입력해주세요.
        </p>
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="계정 비밀번호"
          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '20px' }}
        />

        <button 
          onClick={() => onResetData(password)}
          style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          정보 초기화
        </button>
        
        <button 
          onClick={() => onDeleteAccount(password)}
          style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          계정 완전 삭제
        </button>

        <button 
          onClick={onClose}
          style={{ width: '100%', padding: '10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}>
          취소
        </button>
      </div>
    </div>
  );
}

function tabButtonStyle(active) {
  return {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    borderRadius: 6,
    background: active ? '#3b82f6' : '#f5f6f7',
    color: active ? '#fff' : '#222',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: active ? '0 2px 8px rgba(59,130,246,0.08)' : 'none',
    transition: 'background 0.2s, color 0.2s',
  };
} 