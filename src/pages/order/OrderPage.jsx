import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../../api/wordpress';

export default function OrderPage() {
  const { storeSlug, tableId } = useParams();
  const accountId = storeSlug;
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);

  console.log('✅ OrderPage 컴포넌트 렌더링됨', accountId, tableId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. 카테고리 불러오기
        const catRes = await axios.get(`${API_CONFIG.baseURL}/custom/v1/get-categories-by-store?accountId=${accountId}`, {
          headers: {
            Authorization: `Basic ${API_CONFIG.wpAuthToken}`
          }
        });
        const myCategories = catRes.data;
        setCategories(myCategories);
        const myCategoryIds = myCategories.map(cat => cat.id);
        console.log('🔖 내 카테고리:', myCategories.map(c => c.name));

        // 2. 상품 불러오기 (첫 카테고리 기준)
        const prodRes = await axios.get(`${API_CONFIG.baseURL}/custom/v1/get-products-by-category?slug=${myCategories[0]?.slug}`, {
          headers: {
            Authorization: `Basic ${API_CONFIG.wpAuthToken}`
          }
        });
        console.log('📦 전체 WooCommerce 상품 구조:', prodRes.data);
        // 상품에 카테고리명 추가
        const productsWithCategory = prodRes.data.map(product => {
          const cat = (product.categories && product.categories.length > 0)
            ? myCategories.find(c => c.id === product.categories[0].id)
            : null;
          return {
            ...product,
            categoryName: cat ? cat.name : ''
          };
        });
        setProducts(productsWithCategory);
      } catch (err) {
        console.error('❌ 메뉴/카테고리 불러오기 실패:', err.response?.data || err.message);
        setError('메뉴를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [accountId]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, count: item.count + 1 } : item
        );
      }
      return [...prev, { ...product, count: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartItemCount = (productId, newCount) => {
    if (newCount < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, count: newCount } : item
      )
    );
  };

  const handleSubmitOrder = async () => {
    try {
      const storeSlug = toSlug(params.storeId);
      const tableNumber = params.tableId;
      const orderData = {
        storeSlug,
        tableNumber,
        orders: selectedItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category: item.categoryName
        })),
        totalAmount: calculateTotal(),
        status: '신규'
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/custom/v1/order`,
        orderData,
        {
          headers: {
            Authorization: `Basic ${btoa(import.meta.env.VITE_WP_ADMIN_USER + ':' + import.meta.env.VITE_WP_APP_PASSWORD)}`
          }
        }
      );

      setSelectedItems([]);
      alert('주문이 완료되었습니다!');
    } catch (err) {
      console.error('주문 실패:', err.response?.data || err.message);
      alert('주문에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 주문 내역 모달
  const renderHistoryModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={() => setShowHistory(false)}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#000', marginBottom: 12 }}>내가 시킨 내역</h3>
        {orderHistory.length === 0 ? (
          <div style={{ color: '#000' }}>주문 내역이 없습니다.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, color: '#000' }}>
            {orderHistory.map((order, idx) => (
              <li key={idx} style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>주문번호: {order.orderNumber || '(임시)'}</div>
                <div style={{ fontSize: '0.95em', color: '#333', marginBottom: 4 }}>{new Date(order.date).toLocaleString()}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {order.items.map((item, i) => (
                    <li key={i} style={{ color: '#000' }}>
                      <span>[{item.category}] {item.name}</span> x <span>{item.quantity}</span>개 - <span>{(item.price * item.quantity).toLocaleString()}원</span>
                    </li>
                  ))}
                </ul>
                <div style={{ fontWeight: 700, marginTop: 4 }}>총액: {order.total.toLocaleString()}원</div>
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => setShowHistory(false)} style={{ marginTop: 12, padding: '8px 16px', background: '#f0f0f0', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>닫기</button>
      </div>
    </div>
  );

  // 주문 내역 polling (5초마다 새로고침)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 워드프레스에서 해당 매장의 주문 내역 조회
        const res = await axios.get(`${import.meta.env.VITE_API_URL.replace('/wp-json','')}/wp-json/custom/v1/orders/store/${storeSlug}`, {
          headers: {
            Authorization: `Basic ${btoa(import.meta.env.VITE_WP_ADMIN_USER + ':' + import.meta.env.VITE_WP_APP_PASSWORD)}`
          }
        });
        
        // 현재 테이블의 주문만 필터링
        const tableOrders = (res.data || []).filter(order => {
          const orderTableId = String(order.tableId || order.tableNumber).replace('table-', '');
          const currentTableId = String(tableId).replace('table-', '');
          return orderTableId === currentTableId;
        });

        // 주문 데이터 정규화
        const normalizedOrders = tableOrders.map(order => ({
          orderNumber: order.order_id || order.id || '',
          items: Array.isArray(order.orders) 
            ? order.orders 
            : (typeof order.orders === 'string' ? JSON.parse(order.orders) : []),
          total: order.totalAmount || 0,
          date: order.date || order.timestamp || new Date().toISOString()
        }));

        setOrderHistory(normalizedOrders);
      } catch (err) {
        console.error('주문 조회 실패:', err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [storeSlug, tableId]);

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#000' }}>메뉴를 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: '#000', textAlign: 'center' }}>
        {error}
        <br />
        <button onClick={() => window.location.reload()} style={{ marginTop: 16, color: '#000', background: '#fafafa', border: '1px solid #ccc', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>재시도</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fff', color: '#000', width: '100vw', overflowX: 'auto' }}>
      {/* 메인 주문 영역 */}
      <div style={{ flex: 1, padding: 20, minWidth: 360, maxWidth: 800 }}>
        <h2 style={{ color: '#000', fontWeight: 700, letterSpacing: '-1px' }}>
          <span style={{ color: '#000', fontWeight: 700 }}>메뉴 선택</span> <span style={{ color: '#000' }}>(테이블 {tableId})</span>
        </h2>

        {/* 검색창 */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="메뉴 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              width: '100%',
              maxWidth: 300,
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: '1em',
              color: '#000',
              background: '#fff',
              fontWeight: 500
            }}
          />
        </div>

        {/* 메뉴 목록 */}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredProducts.length === 0 ? (
            <li style={{ color: '#000', marginBottom: 10, fontWeight: 500 }}>메뉴가 없습니다.</li>
          ) : filteredProducts.map(product => (
            <li key={product.id} style={{ marginBottom: 10, padding: 10, borderBottom: '1px solid #eee', background: '#fafafa', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                <span style={{ color: '#000', fontWeight: 700, fontSize: '1.1em', marginBottom: 6 }}>[{product.categoryName}] {product.name}</span>
                <span style={{ color: '#000', marginBottom: 12, fontWeight: 500 }}>{Number(product.regular_price).toLocaleString()}원</span>
              </div>
              <button 
                onClick={() => addToCart(product)} 
                aria-label={`장바구니에 ${product.name} 추가`}
                style={{ 
                  alignSelf: 'center',
                  marginLeft: 0,
                  padding: '12px 0',
                  width: '90%',
                  backgroundColor: '#f0f0f0',
                  color: '#000',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  outline: 'none',
                  fontSize: '1.1em',
                  letterSpacing: '-0.5px'
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 2px #007bff44'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              >
                <span style={{ color: '#000', fontWeight: 700 }}>장바구니에 추가</span>
              </button>
            </li>
          ))}
        </ul>

        <hr />

        {/* 장바구니 */}
        <h3 style={{ color: '#000', fontWeight: 700 }}>장바구니</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {cart.length === 0 ? (
            <li style={{ color: '#000', marginBottom: 10, fontWeight: 500 }}>장바구니가 비어있습니다.</li>
          ) : cart.map(item => (
            <li key={item.id} style={{ color: '#000', marginBottom: 10, display: 'flex', alignItems: 'center', background: '#fafafa' }}>
              <span style={{ flex: 1, color: '#000', fontWeight: 700 }}>[{item.categoryName}] {item.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => updateCartItemCount(item.id, item.count - 1)}
                  aria-label={`${item.name} 수량 감소`}
                >
                  -
                </button>
                <span>{item.count}</span>
                <button
                  onClick={() => updateCartItemCount(item.id, item.count + 1)}
                  aria-label={`${item.name} 수량 증가`}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>

        <button onClick={handleSubmitOrder} style={{ marginTop: 16, padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>주문하기</button>
      </div>

      {/* 주문 내역 모달 */}
      {showHistory && renderHistoryModal()}
    </div>
  );
}