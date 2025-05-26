import React from 'react';

export default function SalesTab({ orders }) {
  // 오늘 날짜의 주문만 필터링
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(order => 
    order.timestamp.split('T')[0] === today
  );

  // 총 매출액 계산
  const totalSales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // 시간대별 매출 분석
  const hourlySales = todayOrders.reduce((acc, order) => {
    const hour = new Date(order.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + order.totalAmount;
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
          {todayOrders.slice().reverse().map(order => (
            <div key={order.id} style={{ 
              border: '1px solid #ddd', 
              padding: 10, 
              marginBottom: 10,
              borderRadius: 4 
            }}>
              <p>테이블 {order.tableNumber}</p>
              <p>메뉴: {order.menuItems.join(', ')}</p>
              <p>금액: {order.totalAmount.toLocaleString()}원</p>
              <p>상태: {order.status}</p>
              <p>시간: {new Date(order.timestamp).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 