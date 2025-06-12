import React, { useState, useEffect, useRef } from 'react';
import StoreInfoTab from './dashboard/StoreInfoTab';
import OrderTab from './dashboard/OrderTab';
import SalesTab from './dashboard/SalesTab';
import MenuTab from './dashboard/MenuTab';
import OrderManagePage from './dashboard/OrderManagePage';
import axios from 'axios';
import { toSlug } from '../utils/slug';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [tableCount, setTableCount] = useState(0);
  const [menuList, setMenuList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [callRequests, setCallRequests] = useState([]);
  const [restaurantName, setRestaurantName] = useState(localStorage.getItem('restaurantName') || '내 매장');
  const intervalRef = useRef(null);

  // 초기 데이터 로드
  useEffect(() => {
    const email = localStorage.getItem('user_email');
    if (email) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/user-info?email=${email}`)
        .then(res => {
          const userData = res.data;
          const meta = userData.meta || {};

          const parsedMenus = typeof meta.menus === 'string' ? JSON.parse(meta.menus) : (meta.menus || []);
          const parsedCategories = typeof meta.categories === 'string' ? JSON.parse(meta.categories) : (meta.categories || []);

          setMenuList(parsedMenus);
          setCategories(parsedCategories);
          setTableCount(meta.tableCount || 1);
          // 회원가입/로그인 시 display_name(가게명) 또는 meta.restaurantName을 restaurantName 상태와 localStorage에 즉시 반영
          const newName = meta.restaurantName || userData.display_name || userData.name || '';
          if (newName) {
            setRestaurantName(newName);
            localStorage.setItem('restaurantName', newName);
          }
        })
        .catch(err => {
          console.error('사용자 정보 불러오기 실패:', err);
        });
    }
  }, []);

  // 가게명 동기화: localStorage, userInfo, form 등에서 최신값으로 갱신
  useEffect(() => {
    const stored = localStorage.getItem('restaurantName');
    if (stored && stored !== restaurantName) {
      setRestaurantName(stored);
    }
  }, [restaurantName]);

  // 메뉴/카테고리 정보 저장
  const saveMenuData = async () => {
    const email = localStorage.getItem('user_email');
    if (!email) return;

    try {
      console.log('💾 저장 직전 menuList:', menuList);
      console.log('💾 저장 직전 categories:', categories);
      await axios.post(`${import.meta.env.VITE_API_URL}/api/update-user-info`, {
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
    try {
      const orderData = {
        storeSlug: restaurantName,
        tableNumber,
        orders: menuItems.map(item => ({
          name: item.name,
          category: item.category || '',
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
        totalAmount,
        status: '신규'
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, orderData);
      await fetchOrders();
      alert('주문이 추가되었습니다!');
    } catch (err) {
      alert('주문 추가 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  // 주문 상태 업데이트 함수
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders/update-order`, {
        orderId,
        status: newStatus
      });
      await fetchOrders();
    } catch (err) {
      console.error('주문 상태 업데이트 실패:', err);
    }
  };

  // 워드프레스에서 주문 목록 fetch
  const fetchOrders = async () => {
    const storeSlug = toSlug(localStorage.getItem('restaurantName'));
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/store/${storeSlug}`);
      // 주문 데이터 정규화
      const normalizedOrders = (res.data || []).map(order => ({
        ...order,
        orders: Array.isArray(order.orders) 
          ? order.orders 
          : (typeof order.orders === 'string' ? JSON.parse(order.orders) : [])
      }));
      setOrders(normalizedOrders);
    } catch (err) {
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, 5000); // 5초마다 polling
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await axios.get('https://happyfabric02.mycafe24.com/wp-json/wp/v2/call_request', {
          params: { per_page: 20, order: 'desc' }
        });
        setCallRequests(res.data);
      } catch (err) {
        setCallRequests([]);
      }
    };
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'store':
        return <StoreInfoTab tableCount={tableCount} setTableCount={setTableCount} orders={orders} fetchOrders={fetchOrders} restaurantName={restaurantName} setRestaurantName={setRestaurantName} />;
      case 'orders':
        return (
          <OrderManagePage
            tableCount={tableCount}
            setTableCount={setTableCount}
            orders={orders}
            fetchOrders={fetchOrders}
            addOrder={addOrder}
            updateOrderStatus={updateOrderStatus}
            restaurantName={restaurantName}
            setRestaurantName={setRestaurantName}
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
            restaurantName={restaurantName}
            setRestaurantName={setRestaurantName}
          />
        );
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
            <h4 style={{ margin: 0 }}>직원 호출 현황</h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {callRequests.map(call => (
                <li key={call.id} style={{ marginBottom: 4, color: '#f59e42', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    // 테이블 번호 추출
                    const titleStr = call.title?.rendered || '';
                    // HTML 엔티티 변환 및 소문자화
                    const cleanTitle = titleStr.replace(/&#8211;|&ndash;|&mdash;/g, '-').toLowerCase();
                    let tableNum = '?';
                    const match = cleanTitle.match(/table[-\s]?(\d+)/);
                    if (match) {
                      tableNum = match[1];
                    } else {
                      console.warn('호출 title 파싱 실패:', titleStr);
                    }
                    return `${tableNum}번 테이블 직원 호출`;
                  })()}
                  <button
                    onClick={async () => {
                      await axios.delete(`https://happyfabric02.mycafe24.com/wp-json/custom/v1/call/${call.id}`);
                      setCallRequests(prev => prev.filter(c => c.id !== call.id));
                    }}
                    style={{
                      marginLeft: 8,
                      background: '#fff',
                      color: '#222',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      padding: '2px 12px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                  >
                    확인
                  </button>
                </li>
              ))}
            </ul>
          </div>
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