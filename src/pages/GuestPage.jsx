import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import OrderSummaryModal from '../components/OrderSummaryModal';

function getTableKey(storeSlug, tableId) {
  return `${storeSlug}-Table-${String(tableId).replace(/^table-/, '')}`;
}

function toSlug(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, '-');
}

const storeName = decodeURIComponent(params.storeSlug).replace(/-/g, ' ');
function displayName(slug) {
  return decodeURIComponent(String(slug)).replace(/-/g, ' ');
}

function getCategoryDisplayName(categoryName, storeSlug) {
  const decoded = decodeURIComponent(categoryName);
  if (decoded.startsWith(storeSlug + '_')) {
    return decoded.slice(storeSlug.length + 1);
  }
  const parts = decoded.split('_');
  return parts[parts.length - 1];
}

export default function GuestPage() {
  const params = useParams();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  // storeSlug 생성
  const storeSlug = toSlug(params.storeSlug);
  // tableNumber 생성
  const tableNumber = getTableKey(storeSlug, params.tableId);

  // 주문 내역 polling (5초마다 새로고침)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/orders/store/${storeSlug}`);
        const tableOrders = (res.data || []).filter(order => order.tableNumber === tableNumber);
        // 주문 데이터 정규화
        const normalizedOrders = tableOrders.map(order => ({
          ...order,
          orders: Array.isArray(order.orders) 
            ? order.orders 
            : (typeof order.orders === 'string' ? JSON.parse(order.orders) : [])
        }));
        setOrderHistory(normalizedOrders);
      } catch (err) {
        console.error('주문 조회 실패:', err);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [storeSlug, tableNumber]);

  // 카테고리 목록 가져오기 (storeSlug 기준)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/get-categories-by-store/${storeSlug}`);
        setCategories(response.data);
        if (response.data.length > 0) {
          setSelectedCategory(response.data[0]);
        }
      } catch (error) {
        console.error('카테고리 로딩 실패:', error);
      }
    };
    fetchCategories();
  }, [storeSlug]);

  // 선택된 카테고리의 메뉴 가져오기
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!selectedCategory) return;
      try {
        const response = await axios.get(`http://localhost:5001/api/get-products-by-category/${selectedCategory.slug}`);
        setMenuItems(response.data);
      } catch (error) {
        console.error('메뉴 로딩 실패:', error);
      }
    };
    fetchMenuItems();
  }, [selectedCategory]);

  // 주문 추가
  const addToOrder = (menuItem) => {
    setOrders(prevOrders => {
      const existingOrderIndex = prevOrders.findIndex(order => order.name === menuItem.name);
      let newOrders;
      if (existingOrderIndex >= 0) {
        newOrders = prevOrders.map((order, index) =>
          index === existingOrderIndex
            ? { ...order, quantity: order.quantity + 1 }
            : order
        );
      } else {
        const newOrder = {
          id: Date.now(),
          name: menuItem.name,
          category: menuItem.category || '',
          price: Number(menuItem.price),
          quantity: 1
        };
        newOrders = [...prevOrders, newOrder];
      }
      return newOrders;
    });
  };

  // 주문 수량 변경
  const updateOrderQuantity = (orderId, newQuantity) => {
    if (newQuantity < 1) return;
    setOrders(prevOrders => {
      const newOrders = prevOrders.map(order =>
        order.id === orderId ? { ...order, quantity: newQuantity } : order
      );
      return newOrders;
    });
  };

  // 주문 삭제
  const removeOrder = (orderId) => {
    setOrders(prevOrders => {
      const newOrders = prevOrders.filter(order => order.id !== orderId);
      return newOrders;
    });
  };

  // 주문 제출
  const handleOrderSubmit = async () => {
    if (orders.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    try {
      const orderData = {
        storeSlug,
        tableNumber,
        orders: orders.map(item => ({
          name: item.name,
          category: item.category || '',
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
        totalAmount: orders.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
        status: '신규'
      };
      const response = await axios.post('http://localhost:5001/api/orders', orderData);
      if (response.data.success) {
        setOrders([]);
        setIsOrderModalOpen(false);
        alert('주문이 접수되었습니다!');
      } else {
        throw new Error(response.data.error || '주문 접수에 실패했습니다.');
      }
    } catch (err) {
      alert('주문 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>테이블 {displayName(params.tableId)}</h1>
      {/* 카테고리 목록 */}
      <div style={{ marginBottom: 20 }}>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            style={{
              marginRight: 10,
              padding: '8px 16px',
              background: selectedCategory?.id === category.id ? '#3b82f6' : '#f3f4f6',
              color: selectedCategory?.id === category.id ? '#fff' : '#222',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            {getCategoryDisplayName(category.name, storeSlug)}
          </button>
        ))}
      </div>
      {/* 메뉴 목록 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {menuItems.map(item => (
          <div
            key={item.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer'
            }}
            onClick={() => addToOrder(item)}
          >
            <h3 style={{ margin: '0 0 8px 0' }}>{displayName(item.name)}</h3>
            <p style={{ margin: 0, color: '#64748b' }}>{item.price.toLocaleString()}원</p>
          </div>
        ))}
      </div>
      {/* 주문 모달 */}
      <OrderSummaryModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        orders={orders}
        onUpdateQuantity={updateOrderQuantity}
        onRemoveOrder={removeOrder}
        onOrder={handleOrderSubmit}
      />
      {/* 주문 내역 */}
      {orderHistory.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>주문 내역</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {orderHistory.map((order, idx) => (
              <div key={idx} style={{ border: '1px solid #e2e8f0', padding: 16, marginBottom: 10, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  주문번호: {order.orderNumber}
                </div>
                <div style={{ fontSize: '0.9em', color: '#64748b', marginBottom: 8 }}>
                  {new Date(order.date).toLocaleString()}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {order.orders.map((item, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {displayName(item.name)} x {item.quantity}개 - {(item.price * item.quantity).toLocaleString()}원
                    </li>
                  ))}
                </ul>
                <div style={{ textAlign: 'right', fontWeight: 600, marginTop: 8 }}>
                  총액: {order.total.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* 장바구니 버튼 */}
      <button
        onClick={() => setIsOrderModalOpen(true)}
        style={{
          position: 'fixed',
          right: 32,
          bottom: 32,
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 24,
          padding: '16px 28px',
          fontSize: 18,
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(59,130,246,0.15)',
          cursor: 'pointer'
        }}
      >
        장바구니 ({orders.length})
      </button>
    </div>
  );
} 