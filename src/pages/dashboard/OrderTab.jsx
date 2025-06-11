import React, { useState, useEffect } from 'react';
import axios from 'axios';

function safeDecode(name) {
  try {
    if (/^(u[0-9a-fA-F]{4})+$/.test(name)) {
      return name.replace(/u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
    }
    if (/^%[0-9A-Fa-f]{2}/.test(name)) return decodeURIComponent(name);
    return name;
  } catch {
    return name;
  }
}

function getTableKey(storeSlug, tableId) {
  return `${storeSlug}-Table-${String(tableId).replace(/^table-/, '')}`;
}

export default function OrderTab({ tableCount, setTableCount }) {
  const [orders, setOrders] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [newOrder, setNewOrder] = useState({ menuItems: [], totalAmount: 0 });
  const storeSlug = localStorage.getItem('restaurantName');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/orders/store/${storeSlug}`);
        setOrders(res.data);
      } catch (err) {
        // 에러 무시
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [storeSlug]);

  const getTableOrders = (tableNumber) => {
    const myTableKey = getTableKey(storeSlug, tableNumber);
    return orders.filter(order => order.tableNumber === myTableKey);
  };

  // 주문 삭제
  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`http://localhost:5001/api/orders/${orderId}`);
      // 삭제 후 목록 새로고침
      const res = await axios.get(`http://localhost:5001/api/orders/store/${storeSlug}`);
      setOrders(res.data);
    } catch (err) {
      alert('주문 삭제 실패');
    }
  };

  // 주문 추가 처리 (임시, 실제 주문 생성은 별도 구현 필요)
  const handleAddOrder = async (tableNumber) => {
    if (newOrder.menuItems.length === 0) {
      alert('메뉴를 선택해주세요');
      return;
    }
    const ordersArr = newOrder.menuItems.map(name => ({
      name,
      price: 10000,
      quantity: 1
    }));
    try {
      await axios.post('http://localhost:5001/api/orders', {
        storeSlug,
        tableNumber: getTableKey(storeSlug, tableNumber),
        orders: ordersArr,
        totalAmount: ordersArr.reduce((sum, item) => sum + item.price * item.quantity, 0)
      });
      const res = await axios.get(`http://localhost:5001/api/orders/store/${storeSlug}`);
      setOrders(res.data);
      setNewOrder({ menuItems: [], totalAmount: 0 });
      setSelectedTable(null);
      alert('주문이 추가되었습니다!');
    } catch (err) {
      alert('주문 추가 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', color: '#222' }}>
      <div style={{ width: '20%', borderRight: '1px solid #ccc', padding: 10 }}>
        <h4>총 주문 현황</h4>
        <p>전체 주문: {orders.length}건</p>
        <p>진행 중: {orders.filter(order => order.status === '진행중').length}건</p>
      </div>
      <div style={{ width: '80%', padding: 10, height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <input
          type="number"
          value={tableCount}
          onChange={(e) => {
            let val = e.target.value.replace(/^0+/, '');
            setTableCount(val === '' ? '' : Number(val));
          }}
          placeholder="테이블 수 입력"
        />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 20,
            alignContent: 'flex-start',
            justifyContent: 'flex-start',
            boxSizing: 'border-box',
          }}
        >
          {[...Array(Number(tableCount))].map((_, idx) => {
            const tableNumber = idx + 1;
            const tableOrders = getTableOrders(tableNumber);
            const menuList = tableOrders.flatMap(order => {
              let items = order.orders;
              if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch { items = []; }
              }
              if (!Array.isArray(items)) return [];
              return items.map(item => `${safeDecode(item.name)} x ${item.quantity}`);
            });
            const totalAmount = tableOrders.flatMap(order => {
              let items = order.orders;
              if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch { items = []; }
              }
              if (!Array.isArray(items)) return [];
              return items.map(item => Number(item.price) * Number(item.quantity || 1));
            }).reduce((a, b) => a + b, 0);
            const lastStatus = tableOrders.length > 0 ? (tableOrders[tableOrders.length - 1].status || '진행중') : '';
            const lastOrderId = tableOrders.length > 0 ? (tableOrders[tableOrders.length - 1].order_id || tableOrders[tableOrders.length - 1].id) : null;

            return (
              <div key={idx} style={{ border: '1px solid #ddd', minWidth: 110, maxWidth: 140, width: 'calc(20vw - 32px)', padding: 10, boxSizing: 'border-box' }}>
                <h5>테이블 {tableNumber}</h5>
                {tableOrders.length > 0 ? (
                  <>
                    <p>메뉴: {menuList.length > 0 ? menuList.join(', ') : '없음'}</p>
                    <p>총액: {totalAmount.toLocaleString()}원</p>
                    <p>상태: {lastStatus}</p>
                    {lastOrderId && (
                      <button onClick={() => handleDeleteOrder(lastOrderId)} style={{ marginTop: 5, padding: '5px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4 }}>주문 삭제</button>
                    )}
                  </>
                ) : (
                  <>
                    <p>메뉴: 없음</p>
                    <p>총액: 0원</p>
                    <button 
                      onClick={() => setSelectedTable(tableNumber)}
                      style={{ marginTop: 5, padding: '5px 10px' }}
                    >
                      주문하기
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {selectedTable && (
          <div style={{ marginTop: 20, padding: 20, border: '1px solid #ddd' }}>
            <h4>테이블 {selectedTable} 주문하기</h4>
            <div>
              <input
                type="text"
                placeholder="메뉴 입력"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const menuItem = e.target.value;
                    setNewOrder({
                      menuItems: [...newOrder.menuItems, menuItem],
                      totalAmount: newOrder.totalAmount + 10000 // 임시 가격
                    });
                    e.target.value = '';
                  }
                }}
              />
              <button onClick={() => handleAddOrder(selectedTable)}>주문 추가</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <p>선택된 메뉴: {newOrder.menuItems.join(', ')}</p>
              <p>총액: {newOrder.totalAmount.toLocaleString()}원</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 