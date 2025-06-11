import React from 'react';

function decodeUnicodeHex(str) {
  return str.replace(/u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}
function safeDecode(name) {
  try {
    if (/^(u[0-9a-fA-F]{4})+$/.test(name)) return decodeUnicodeHex(name);
    if (/^%[0-9A-Fa-f]{2}/.test(name)) return decodeURIComponent(name);
    return name;
  } catch {
    return name;
  }
}

export default function SalesTab({ orders }) {
  // 오늘 날짜의 주문만 필터링
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = (orders || []).filter(order => {
    // timestamp, date, created_at 등 다양한 필드 지원
    const ts = order.timestamp || order.date || order.created_at;
    if (!ts) return false;
    return ts.split('T')[0] === today;
  });

  // 총 매출액 계산
  const totalSales = todayOrders.reduce((sum, order) => {
    let items = order.items || order.orders;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items)) return sum;
    return sum + items.reduce((s, item) => s + (Number(item.price) * Number(item.quantity || 1)), 0);
  }, 0);

  // 시간대별 매출 분석
  const hourlySales = todayOrders.reduce((acc, order) => {
    const ts = order.timestamp || order.date || order.created_at;
    const hour = ts ? new Date(ts).getHours() : 0;
    let items = order.items || order.orders;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items)) items = [];
    const amount = items.reduce((s, item) => s + (Number(item.price) * Number(item.quantity || 1)), 0);
    acc[hour] = (acc[hour] || 0) + amount;
    return acc;
  }, {});

  return (
    <div style={{ color: '#222' }}>
      <h3>오늘의 매출 현황</h3>
      
      <div style={{ marginTop: 20 }}>
        <h4>기본 정보</h4>
        <p>총 주문 건수: {todayOrders.length}건</p>
        <p>총 매출액: {totalSales.toLocaleString()}원</p>
        <p>평균 주문 금액: {(totalSales / (todayOrders.length || 1)).toLocaleString()}원</p>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>시간대별 매출</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(hourlySales).map(([hour, amount]) => (
            <div key={hour} style={{ 
              border: '1px solid #ddd', 
              padding: 10, 
              borderRadius: 4,
              minWidth: 100 
            }}>
              <p>{hour}시</p>
              <p>{amount.toLocaleString()}원</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>최근 주문 내역</h4>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {todayOrders.slice().reverse().map(order => {
            let items = order.items || order.orders;
            if (typeof items === 'string') {
              try { items = JSON.parse(items); } catch { items = []; }
            }
            if (!Array.isArray(items)) items = [];
            return (
              <div key={order.id || order.order_id} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 10, borderRadius: 4 }}>
                <p>테이블 {order.tableNumber || order.tableId}</p>
                <p>메뉴: {items.map(item => `${safeDecode(item.name)} x ${item.quantity}`).join(', ')}</p>
                <p>금액: {items.reduce((s, item) => s + (Number(item.price) * Number(item.quantity || 1)), 0).toLocaleString()}원</p>
                <p>상태: {order.status}</p>
                <p>시간: {new Date(order.timestamp || order.date || order.created_at).toLocaleTimeString()}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 