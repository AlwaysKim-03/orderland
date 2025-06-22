import React, { useState, useEffect, useCallback } from 'react';
import StoreInfoTab from './dashboard/StoreInfoTab';
import OrderTab from './dashboard/OrderTab';
import SalesTab from './dashboard/SalesTab';
import MenuTab from './dashboard/MenuTab';
import OrderManagePage from './dashboard/OrderManagePage';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch, getDocs, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [orders, setOrders] = useState([]);
  const [callRequests, setCallRequests] = useState([]);
  const [restaurantName, setRestaurantName] = useState('내 매장');
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 1. 현재 사용자 정보 가져오기
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. 가게 정보(이름) 가져오기
  const fetchStoreInfo = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setRestaurantName(userData.store_name || '내 매장');
      }
    } catch (error) {
      console.error("가게 정보 불러오기 실패:", error);
    }
  }, [currentUser]);

  // 3. 주문 내역 실시간으로 가져오기
  const setupOrderListener = useCallback(() => {
    if (!currentUser) return null;
    const q = query(collection(db, "orders"), where("storeId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(fetchedOrders);
    });
    return unsubscribe;
  }, [currentUser]);

  // 4. 직원 호출 실시간으로 가져오기
  const setupCallListener = useCallback(() => {
    if (!currentUser) return null;
    const q = query(collection(db, "staff_calls"), where("storeId", "==", currentUser.uid), where("status", "==", "new"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCalls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCallRequests(fetchedCalls);
    });
    return unsubscribe;
  }, [currentUser]);

  // 5. 직원 호출 확인 처리
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

  useEffect(() => {
    if (currentUser) {
      fetchStoreInfo();
      const unsubscribeOrders = setupOrderListener();
      const unsubscribeCalls = setupCallListener();

      return () => {
        if (unsubscribeOrders) unsubscribeOrders();
        if (unsubscribeCalls) unsubscribeCalls();
      };
    }
  }, [currentUser, fetchStoreInfo, setupOrderListener, setupCallListener]);


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

  const renderContent = () => {
    // 이제 각 탭은 더 이상 props를 내려받을 필요가 없습니다. 
    // 각 탭 컴포넌트가 직접 Firestore에서 데이터를 가져오는 것이 더 효율적입니다.
    // 하지만 우선은 기존 구조를 최대한 유지하여 수정합니다.
    switch (activeTab) {
      case 'store':
        return <StoreInfoTab onStoreUpdate={fetchStoreInfo} />;
      case 'orders':
        return (
          <OrderManagePage
            orders={orders}
            restaurantName={restaurantName}
          />
        );
      case 'sales':
        return <SalesTab orders={orders} />;
      case 'menu':
        // MenuTab은 자체적으로 데이터를 불러오므로 props가 필요 없습니다.
        return <MenuTab />;
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