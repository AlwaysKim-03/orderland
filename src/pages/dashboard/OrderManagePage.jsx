import React, { useState, useEffect } from 'react';
import axios from 'axios';

function decodeUnicode(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)))
            .replace(/\\u([0-9a-fA-F]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)))
            .replace(/u([0-9a-fA-F]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)));
}

function safeDecode(name) {
  try {
    if (/^(u[0-9a-fA-F]{4})+$/.test(name)) return decodeUnicode(name);
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

function displayName(slug) {
  return String(slug).replace(/-/g, ' ');
}

function OrderDetailModal({ isOpen, onClose, orders = [], menuList, tableNumber, fetchOrders }) {
  const [menuQuantities, setMenuQuantities] = useState({});
  if (!isOpen || !orders.length) return null;
  // 주문 전체 금액
  const total = orders.reduce((sum, order) => {
    const items = getOrderItems(order);
    return sum + items.reduce((s, item) => s + Number(item.price) * Number(item.quantity || 1), 0);
  }, 0);

  // 메뉴 추가(새 주문 post)
  const handleAddMenu = async (menu) => {
    const qty = Math.max(1, Number(menuQuantities[menu.id]) || 1);
    const storeSlug = toSlug(localStorage.getItem('restaurantName'));
    if (!tableNumber) {
      alert('테이블 번호가 올바르지 않습니다.');
      return;
    }
    await axios.post('http://localhost:5001/api/orders', {
      storeSlug,
      tableNumber,
      orders: [{ name: menu.name, price: menu.regular_price, quantity: qty }],
      totalAmount: menu.regular_price * qty,
      status: '신규'
    });
    if (fetchOrders) await fetchOrders();
  };

  // 초기화(모든 주문 삭제)
  const handleClearAll = async () => {
    for (const order of orders) {
      const oid = order.id || order.order_id;
      if (!oid) continue;
      await axios.post('http://localhost:5001/api/orders/delete-order', { orderId: oid });
    }
    if (fetchOrders) await fetchOrders();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 0, minWidth: 600, maxWidth: 900, width: '90%', display: 'flex', flexDirection: 'row', boxShadow: '0 4px 24px #0002' }}>
        {/* 왼쪽: 주문내역 */}
        <div style={{ flex: 1, padding: 32, borderRight: '1px solid #eee', minWidth: 320 }}>
          <h3 style={{ marginTop: 0, marginBottom: 24 }}>주문내역 (테이블 {displayName(tableNumber)})</h3>
          {orders.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', margin: '40px 0' }}>주문이 없습니다.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {orders.map((order, idx) => {
                const items = getOrderItems(order);
                const orderTotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);
                return (
                  <li key={order.id || order.order_id || idx} style={{ marginBottom: 16, borderBottom: '1px solid #f1f1f1', paddingBottom: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.timestamp ? new Date(order.timestamp).toLocaleString() : ''}</div>
                    {items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span>{decodeUnicode(item.name)} x {item.quantity}</span>
                        <span>{(item.price * item.quantity).toLocaleString()}원</span>
                      </div>
                    ))}
                    <div style={{ textAlign: 'right', fontWeight: 600, color: '#3b82f6', marginTop: 4 }}>총액: {orderTotal.toLocaleString()}원</div>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ marginTop: 32, fontWeight: 700, fontSize: 20, textAlign: 'right' }}>총액: {total.toLocaleString()}원</div>
        </div>
        {/* 오른쪽: 메뉴리스트 */}
        <div style={{ flex: 1, padding: 32, minWidth: 280, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button onClick={handleClearAll} style={{ background: '#f3f4f6', color: '#ef4444', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, marginRight: 8 }}>초기화</button>
            <button onClick={onClose} style={{ background: 'none', color: '#888', border: 'none', fontSize: 28, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <h4 style={{ margin: '0 0 16px 0' }}>메뉴 추가</h4>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {menuList.length === 0 ? (
              <div style={{ color: '#aaa', textAlign: 'center', margin: '40px 0' }}>등록된 메뉴가 없습니다.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {menuList.map(menu => (
                  <li key={menu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #f1f1f1', paddingBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{decodeUnicode(menu.name)}</span>
                      <span style={{ color: '#888', marginLeft: 8 }}>{Number(menu.regular_price).toLocaleString()}원</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} value={menuQuantities[menu.id] || 1} onChange={e => setMenuQuantities(prev => ({ ...prev, [menu.id]: e.target.value }))} style={{ width: 48, marginRight: 4, border: '1px solid #ddd', borderRadius: 4, padding: '2px 6px' }} />
                      <button onClick={() => handleAddMenu(menu)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }}>추가</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 주문 아이템 배열 파싱 유틸 함수
function getOrderItems(order) {
  let items = order.orders || order.items || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) items = [];
  return items;
}

function getTableKey(storeSlug, tableId) {
  return `${storeSlug}-Table-${String(tableId).replace(/^table-/, '')}`;
}

function getCategoryDisplayName(categoryName, storeSlug) {
  const decoded = decodeURIComponent(categoryName);
  if (decoded.startsWith(storeSlug + '_')) {
    return decoded.slice(storeSlug.length + 1);
  }
  const parts = decoded.split('_');
  return parts[parts.length - 1];
}

export default function OrderManagePage({ tableCount = 10, setTableCount, fetchOrders, orders = [] }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [menuList, setMenuList] = useState([]);
  const [acknowledgedTables, setAcknowledgedTables] = useState([]);
  const storeSlug = toSlug(localStorage.getItem('restaurantName'));
  const [acknowledgedOrderIds, setAcknowledgedOrderIds] = useState(() => {
    const saved = localStorage.getItem('acknowledgedOrderIds');
    return saved ? JSON.parse(saved) : [];
  });

  // 메뉴 리스트 불러오기
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        // 1. accountId 얻기
        const idRes = await axios.get(`http://localhost:5001/api/get-account-id?storeName=${encodeURIComponent(storeSlug)}`);
        const accountId = idRes.data?.accountId;
        if (!accountId) return;
        // 2. 카테고리 목록 얻기
        const catRes = await axios.get(`http://localhost:5001/api/get-categories-by-store?accountId=${accountId}`);
        const categories = catRes.data;
        // 3. 모든 카테고리의 상품 합치기
        let allMenus = [];
        for (const cat of categories) {
          const prodRes = await axios.get(`http://localhost:5001/api/get-products-by-category?slug=${cat.slug}`);
          allMenus = allMenus.concat(prodRes.data);
        }
        setMenuList(allMenus);
      } catch (err) {
        setMenuList([]);
      }
    };
    fetchMenus();
  }, [storeSlug]);

  // 테이블별 주문 필터링
  const getTableOrders = (tableNumber) => {
    const myTableKey = getTableKey(storeSlug, tableNumber);
    // 최신순 정렬
    return orders
      .filter(order => order.tableNumber === myTableKey)
      .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
  };

  // 주문 수정/삭제/추가 핸들러 (워드프레스 연동은 실제 구현 필요)
  const handleUpdateOrder = async (order, newItems) => {
    try {
      const totalAmount = newItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);
      if (!order.id && !order.order_id) {
        const payload = {
          accountId: encodeURIComponent(storeSlug),
          tableId: order.tableNumber || order.tableId,
          items: newItems,
          totalAmount,
          status: '진행중'
        };
        await axios.post('http://localhost:5001/api/orders', payload);
      } else {
        const payload = {
          orderId: order.id || order.order_id,
          orders: newItems,
          totalAmount,
          tableNumber: order.tableNumber || order.tableId,
          storeSlug: encodeURIComponent(storeSlug),
          status: '진행중'
        };
        await axios.post('http://localhost:5001/api/orders/update-order', payload);
      }
      if (fetchOrders) await fetchOrders();
    } catch (err) {
      alert('주문 저장 실패: ' + (err.response?.data?.message || err.message));
    }
  };
  const handleDeleteOrder = async (order) => {
    if (!order.id && !order.order_id) {
      alert('삭제할 주문이 없습니다.');
      return;
    }
    try {
      const payload = {
        orderId: order.id || order.order_id,
        storeSlug: encodeURIComponent(storeSlug),
      };
      await axios.post('http://localhost:5001/api/orders/delete-order', payload);
      if (fetchOrders) await fetchOrders();
    } catch (err) {
      alert('주문 삭제 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  // 신규 주문 테이블 번호 목록
  const newOrderTables = [];
  for (let idx = 1; idx <= Number(tableCount); idx++) {
    const tableOrders = getTableOrders(idx);
    const lastOrder = tableOrders.length > 0 ? tableOrders[tableOrders.length - 1] : null;
    let isNew = false;
    if (lastOrder) {
      const now = Date.now();
      const created = lastOrder.timestamp ? new Date(lastOrder.timestamp).getTime() : 0;
      if (created && now - created < 60 * 1000) isNew = true;
      if (lastOrder.status === '신규' || lastOrder.status === 'new') isNew = true;
    }
    if (acknowledgedTables.includes(idx)) isNew = false;
    if (isNew) newOrderTables.push(idx);
  }

  // 실시간 주문내역에 노출할 주문만 필터링 (확인된 주문은 제외)
  const realtimeOrders = orders.filter(order => !acknowledgedOrderIds.includes(order.id || order.order_id));

  const handleAcknowledge = (orderId) => {
    setAcknowledgedOrderIds(prev => {
      const updated = [...prev, orderId];
      localStorage.setItem('acknowledgedOrderIds', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div style={{ width: '100%', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'row' }}>
      {/* 왼쪽: 테이블별 주문 현황 */}
      <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#222', marginBottom: 20 }}>테이블별 주문 현황</h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>주문 테이블</span>
          {newOrderTables.length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 12, padding: '2px 14px', fontWeight: 700, fontSize: 18 }}>{newOrderTables.length}</span>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 700, marginRight: 8 }}>테이블 수:</label>
          <input
            type="number"
            value={tableCount}
            onChange={e => {
              let val = e.target.value.replace(/^0+/, '');
              setTableCount && setTableCount(val === '' ? '' : Number(val));
            }}
            placeholder="테이블 수 입력"
          />
        </div>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            marginTop: 20,
            alignContent: 'flex-start',
            justifyContent: 'flex-start',
            boxSizing: 'border-box',
          }}
        >
          {[...Array(Number(tableCount))].map((_, idx) => {
            const tableNumber = idx + 1;
            const tableOrders = getTableOrders(tableNumber);
            return (
              <div
                key={idx}
                style={{
                  background: '#ff9800',
                  color: '#fff',
                  borderRadius: 10,
                  minWidth: 110,
                  maxWidth: 180,
                  width: 'calc(20vw - 32px)',
                  padding: 16,
                  position: 'relative',
                  boxSizing: 'border-box',
                  marginBottom: 12
                }}
                onClick={() => {
                  setSelectedOrder(tableOrders); // 주문이 없으면 빈 배열
                  setDetailOpen(true);
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>테이블 {tableNumber}</div>
                {tableOrders.length === 0 ? (
                  <div style={{ color: '#fff8', fontSize: 14 }}>주문 없음</div>
                ) : (
                  <div>
                    {tableOrders.map((order, i) => {
                      const items = getOrderItems(order);
                      const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);
                      const orderTime = order.timestamp ? new Date(order.timestamp).toLocaleTimeString().slice(0,5) : '';
                      return (
                        <div key={order.id || order.order_id || i} style={{ borderBottom: '1px solid #fff3', marginBottom: 8, paddingBottom: 6 }}>
                          <div style={{ fontSize: 13, color: '#fff', marginBottom: 2 }}>{orderTime}</div>
                          <div>
                            {items.map((item, j) => (
                              <div key={j} style={{ fontSize: 15, color: '#fff' }}>{decodeUnicode(item.name)} x {item.quantity}</div>
                            ))}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{totalAmount.toLocaleString()}원</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <OrderDetailModal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          orders={selectedOrder || []}
          menuList={menuList}
          tableNumber={selectedOrder && selectedOrder[0] ? selectedOrder[0].tableNumber : null}
          fetchOrders={fetchOrders}
        />
      </div>
      {/* 오른쪽: 실시간 주문내역 패널 */}
      <div style={{ width: 340, minWidth: 260, background: '#f8f8f8', borderLeft: '1px solid #eee', padding: 24, boxSizing: 'border-box', minHeight: '100vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#000', marginBottom: 16 }}>실시간 주문내역</h3>
        {realtimeOrders.length === 0 ? (
          <div style={{ color: '#000' }}>주문 내역이 없습니다.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, color: '#000' }}>
            {realtimeOrders.slice().reverse().map((order, idx) => (
              <li key={order.id || order.order_id || idx} style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, marginRight: 8 }}>
                    {order.tableNumber ? `${order.tableNumber.replace(/.*Table[- ]?/, '')}번 테이블` : '테이블'}
                  </span>
                  {Array.isArray(order.orders) && order.orders.length > 0
                    ? order.orders.map((item, i) =>
                        `${decodeUnicode(item.name)} x ${item.quantity}${i < order.orders.length - 1 ? ', ' : ''}`
                      ).join('')
                    : '주문 없음'}
                </div>
                <button onClick={() => handleAcknowledge(order.id || order.order_id)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}>확인</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 