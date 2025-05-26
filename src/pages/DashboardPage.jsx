import React, { useState, useEffect } from 'react';
import StoreInfoTab from './dashboard/StoreInfoTab';
import OrderTab from './dashboard/OrderTab';
import SalesTab from './dashboard/SalesTab';
import MenuTab from './dashboard/MenuTab';
import axios from 'axios';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [tableCount, setTableCount] = useState(0);
  const [menuList, setMenuList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  // 매장이름을 localStorage에서 읽어오고, 없으면 '내 매장'으로 표시
  const restaurantName = localStorage.getItem('restaurantName') || '내 매장';

  // 초기 데이터 로드
  useEffect(() => {
    const email = localStorage.getItem('user_email');
    if (email) {
      axios.get(`http://localhost:5001/api/user-info?email=${email}`)
        .then(res => {
          const userData = res.data;
          const meta = userData.meta || {};

          const parsedMenus = typeof meta.menus === 'string' ? JSON.parse(meta.menus) : (meta.menus || []);
          const parsedCategories = typeof meta.categories === 'string' ? JSON.parse(meta.categories) : (meta.categories || []);

          setMenuList(parsedMenus);
          setCategories(parsedCategories);
          setTableCount(meta.tableCount || 1);
        })
        .catch(err => {
          console.error('사용자 정보 불러오기 실패:', err);
        });
    }
  }, []);

  // 메뉴/카테고리 정보 저장
  const saveMenuData = async () => {
    const email = localStorage.getItem('user_email');
    if (!email) return;

    try {
      console.log('💾 저장 직전 menuList:', menuList);
      console.log('💾 저장 직전 categories:', categories);
      await axios.post('http://localhost:5001/api/update-user-info', {
        email,
        meta: {
          menus: JSON.stringify(menuList),
          categories: JSON.stringify(categories),
          tableCount
        }
      });
      console.log('메뉴 정보 저장 완료');
    } catch (err) {
      console.error('메뉴 정보 저장 실패:', err);
      alert('메뉴 정보 저장에 실패했습니다.');
    }
  };

  // 테이블 수 변경 시 저장
  useEffect(() => {
    if (tableCount > 0) {
      saveMenuData();
    }
  }, [tableCount]);

  // 메뉴/카테고리 변경 시 저장
  useEffect(() => {
    if (menuList.length > 0 || categories.length > 0) {
      saveMenuData();
    }
  }, [menuList, categories]);

  // 주문 추가 함수
  const addOrder = async (tableNumber, menuItems, totalAmount) => {
    const newOrder = {
      id: Date.now(),
      tableNumber,
      menuItems,
      totalAmount,
      status: '진행중',
      timestamp: new Date().toISOString()
    };

    // 임시로 주문 추가
    setOrders(prevOrders => [...prevOrders, newOrder]);

    try {
      const response = await axios.post('http://localhost:5001/api/save-order', {
        tableNumber,
        menuItems,
        totalAmount
      });

      if (response.data.success) {
        console.log('✅ 주문 백엔드 저장 완료:', response.data.data);
      } else {
        throw new Error(response.data.error || '주문 저장 실패');
      }
    } catch (err) {
      console.error('❌ 주문 백엔드 저장 실패:', err);
      // 실패 시 주문 목록에서 제거
      setOrders(prevOrders => prevOrders.filter(order => order.id !== newOrder.id));
      throw err; // 에러를 상위로 전파하여 UI에서 처리할 수 있도록 함
    }
  };

  // 주문 상태 업데이트 함수
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'store':
        return <StoreInfoTab tableCount={tableCount} setTableCount={setTableCount} orders={orders} />;
      case 'orders':
        return (
          <OrderTab 
            tableCount={tableCount} 
            setTableCount={setTableCount} 
            orders={orders}
            addOrder={addOrder}
            updateOrderStatus={updateOrderStatus}
          />
        );
      case 'sales':
        return <SalesTab orders={orders} />;
      case 'menu':
        return (
          <MenuTab 
            menuList={menuList} 
            setMenuList={setMenuList}
            categories={categories}
            setCategories={setCategories}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f5f6f7', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 400, maxWidth: 600, width: '100%', padding: 40 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#222' }}>{restaurantName}</h2>
          <a href="/login" style={{ color: 'red' }}>로그아웃</a>
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