import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import OrderSummaryModal from '../components/OrderSummaryModal';
import styles from './OrderPage.module.css';
// firebase 관련 import 완전 삭제

function getTableKey(storeSlug, tableId) {
  return `${storeSlug}-Table-${String(tableId).replace(/^table-/, '')}`;
}

function OrderHistoryModal({ isOpen, onClose, orderHistory }) {
  if (!isOpen) return null;
  // 누적 총액 계산
  const totalOrderAmount = orderHistory.reduce((sum, order) => {
    const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.orders) ? order.orders : []);
    return sum + items.reduce((s, item) => s + Number(item.price) * Number(item.quantity || 1), 0);
  }, 0);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>총 주문내역</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        {orderHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>주문 내역이 없습니다.</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {orderHistory.map((order, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>주문일시: {order.date ? new Date(order.date).toLocaleString() : '-'}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {(order.items || order.orders || []).map((item, i) => (
                    <li key={i} style={{ fontSize: 15, color: '#222', marginBottom: 2 }}>
                      {safeDecode(item.name)} x {item.count ?? item.quantity ?? 1}개{item.price ? ` (${Number(item.price).toLocaleString()}원)` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.2em', marginTop: 24 }}>
              누적 총액: {totalOrderAmount.toLocaleString()}원
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 음식 이름 디코딩 함수 추가
function safeDecode(name) {
  try {
    // "uce6d ub530uc624" → "한글"
    if (/^(u[0-9a-fA-F]{4}\s*)+$/.test(name)) {
      return name.split(' ').map(part =>
        part.replace(/u([0-9a-fA-F]{4})/g, (match, grp) =>
          String.fromCharCode(parseInt(grp, 16))
        )
      ).join('');
    }
    // URL 인코딩 → 한글
    if (/^%[0-9A-Fa-f]{2}/.test(name)) return decodeURIComponent(name);
    return name;
  } catch {
    return name;
  }
}

function toSlug(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, '-');
}

function getCategoryDisplayName(categoryName, storeSlug) {
  const decoded = decodeURIComponent(categoryName);
  if (decoded.startsWith(storeSlug + '_')) {
    return decoded.slice(storeSlug.length + 1);
  }
  const parts = decoded.split('_');
  return parts[parts.length - 1];
}

function displayName(slug, storeSlug = '') {
  let name = decodeURIComponent(String(slug));
  if (storeSlug && name.startsWith(storeSlug + '_')) {
    name = name.replace(storeSlug + '_', '');
  }
  return name.replace(/-/g, ' ');
}

export default function OrderPage() {
  const params = useParams();
  const storeSlug = toSlug(params.storeSlug);
  const tableNumber = getTableKey(storeSlug, params.tableId);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuQuantities, setMenuQuantities] = useState({});

  // 카테고리 정보 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // storeSlug(김한결-가게) → storeName(slug)
        const storeName = toSlug(storeSlug);
        const idRes = await axios.get(`${import.meta.env.VITE_API_URL.replace('/wp-json','')}/wp-json/custom/v1/get-account-id?storeName=${encodeURIComponent(storeName)}`, {
          headers: {
            Authorization: `Basic ${btoa(import.meta.env.VITE_WP_ADMIN_USER + ':' + import.meta.env.VITE_WP_APP_PASSWORD)}`
          }
        });
        const accountId = idRes.data?.accountId;
        if (!accountId) throw new Error('계정 ID를 찾을 수 없습니다.');
        const res = await axios.get(`http://localhost:5001/api/get-categories-by-store?accountId=${accountId}`);
        if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('카테고리가 없습니다.');
        setCategories(res.data);
        setSelectedCategory(res.data[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [storeSlug]);

  // 메뉴 정보 가져오기
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5001/api/get-products-by-category?slug=${selectedCategory.slug}`);
        setProducts(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, [selectedCategory]);

  // 주문내역 서버에서 불러오는 함수 분리
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/orders/store/${storeSlug}`);
      const myTableKey = getTableKey(storeSlug, params.tableId);
      const filtered = (res.data || []).filter(order => order.tableNumber === myTableKey);
      // 주문 데이터 정규화
      const normalizedOrders = filtered.map(order => ({
        ...order,
        orders: Array.isArray(order.orders) 
          ? order.orders 
          : (typeof order.orders === 'string' ? JSON.parse(order.orders) : [])
      }));
      setOrderHistory(normalizedOrders);
    } catch (err) {
      console.error('주문내역 fetch 실패:', err);
      setOrderHistory([]);
    }
  };

  // 주문내역 useEffect에서 fetchOrders 사용 (5초마다 polling)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [storeSlug, params.tableId]);

  // 수량 변경 핸들러
  const handleQuantityChange = (menuId, delta) => {
    setMenuQuantities(prev => {
      const current = prev[menuId] || 1;
      const next = current + delta;
      if (next < 1) return { ...prev, [menuId]: 1 };
      return { ...prev, [menuId]: next };
    });
  };

  // 주문하기(장바구니에 추가)
  const handleAddToCart = (menu) => {
    const quantity = menuQuantities[menu.id] || 1;
    setCart(prev => {
      const exists = prev.find(item => item.id === menu.id);
      if (exists) {
        return prev.map(item => item.id === menu.id ? { ...item, count: item.count + quantity } : item);
      } else {
        return [...prev, { ...menu, count: quantity }];
      }
    });
    setMenuQuantities(prev => ({ ...prev, [menu.id]: 1 }));
  };

  // 장바구니에서 메뉴 제거
  const removeFromCart = (menuId) => {
    setCart(prev => prev.filter(item => item.id !== menuId));
  };

  // 주문 제출
  const handleOrderSubmit = async () => {
    if (cart.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    try {
      const orderData = {
        storeSlug,
        tableNumber: getTableKey(storeSlug, params.tableId),
        orders: cart.map(item => ({
          name: item.name,
          category: item.category || '',
          price: Number(item.regular_price),
          quantity: Number(item.count)
        })),
        totalAmount: cart.reduce((sum, item) => sum + item.count * Number(item.regular_price), 0),
        status: '신규'
      };
      const response = await axios.post('http://localhost:5001/api/orders', orderData);
      if (response.data.success) {
        await fetchOrders();
        setCart([]);
        setIsCartOpen(false);
        alert('주문이 접수되었습니다!');
      } else {
        throw new Error(response.data.error || '주문 접수에 실패했습니다.');
      }
    } catch (err) {
      alert('주문 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  // 회원가입은 워드프레스 API만 사용하도록 수정
  const handleRegister = async (email, password) => {
    // 워드프레스 회원가입 로직을 여기에 추가할 수 있습니다.
    alert('회원가입은 로그인/회원가입 페이지에서 진행해 주세요.');
  };

  const handleCallStaff = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/custom/v1/call`, {
        storeSlug,
        tableNumber: params.tableId,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          Authorization: `Basic ${btoa(import.meta.env.VITE_WP_ADMIN_USER + ':' + import.meta.env.VITE_WP_APP_PASSWORD)}`
        }
      });
      alert('직원 호출 요청이 전송되었습니다!');
    } catch (err) {
      alert('직원 호출 요청에 실패했습니다.');
    }
  };

  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;
  if (error) return <div style={{ padding: 40, color: 'red' }}>에러: {error}</div>;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* 헤더 섹션 */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '24px',
              color: '#1e293b',
              fontWeight: '600'
            }}>
              {displayName(storeSlug)}
            </h1>
            <p style={{
              margin: '8px 0 0',
              color: '#64748b',
              fontSize: '16px'
            }}>
              테이블 {params.tableId}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCallStaff}
              style={{
                background: '#f59e42',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              직원 호출
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(59,130,246,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
              onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
            >
              <span>장바구니</span>
              {cart.length > 0 && (
                <span style={{
                  background: '#fff',
                  color: '#3b82f6',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* 카테고리 버튼들 */}
        <div className={styles['category-scroll']}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '12px 24px',
                background: selectedCategory?.id === category.id ? '#3b82f6' : '#f1f5f9',
                color: selectedCategory?.id === category.id ? '#fff' : '#1e293b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: selectedCategory?.id === category.id ? '0 2px 4px rgba(59,130,246,0.1)' : 'none'
              }}
            >
              {getCategoryDisplayName(category.name, storeSlug)}
            </button>
          ))}
        </div>
      </div>
      {/* 메뉴 아이템 그리드 */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
        padding: '0 12px'
      }}>
        {products.map(menuItem => (
          <div
            key={menuItem.id}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <h3 style={{
              margin: '0 0 8px',
              fontSize: '18px',
              color: '#1e293b',
              fontWeight: '600'
            }}>
              {displayName(menuItem.name)}
            </h3>
            {/* 이미지 공간 */}
            {menuItem.image ? (
              <img
                src={menuItem.image}
                alt={displayName(menuItem.name)}
                style={{
                  width: '100%',
                  height: '160px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '160px',
                background: '#f1f5f9',
                borderRadius: '8px',
                marginBottom: '12px'
              }} />
            )}
            <div style={{
              marginTop: 'auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {Number(menuItem.regular_price).toLocaleString()}원
              </span>
              {/* 수량 선택 UI */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => handleQuantityChange(menuItem.id, -1)}
                  style={{
                    padding: '4px 10px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 16
                  }}
                >-</button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                  {menuQuantities[menuItem.id] || 1}
                </span>
                <button
                  onClick={() => handleQuantityChange(menuItem.id, 1)}
                  style={{
                    padding: '4px 10px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 16
                  }}
                >+</button>
              </div>
              <button
                onClick={() => handleAddToCart(menuItem)}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
              >
                담기
              </button>
            </div>
          </div>
        ))}
      </div>
      <OrderSummaryModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        orders={cart.map(item => ({
          id: item.id,
          name: item.name,
          price: Number(item.regular_price),
          quantity: item.count
        }))}
        onUpdateQuantity={(id, qty) => {
          if (qty < 1) return;
          setCart(prev => prev.map(item => item.id === id ? { ...item, count: qty } : item));
        }}
        onRemoveOrder={removeFromCart}
        onOrder={cart.length > 0 ? handleOrderSubmit : undefined}
      />
      {/* 오른쪽 하단 floating 총 주문내역 버튼 */}
      <button
        onClick={() => setIsHistoryOpen(true)}
        style={{
          position: 'fixed',
          right: 32,
          bottom: 32,
          zIndex: 3000,
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 24,
          padding: '16px 28px',
          fontSize: 18,
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(59,130,246,0.15)',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
        onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
      >
        총 주문내역
      </button>
      <OrderHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} orderHistory={orderHistory} />
    </div>
  );
} 