import React, { useState } from 'react';

export default function OrderTab({ tableCount, setTableCount, orders, addOrder, updateOrderStatus }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [newOrder, setNewOrder] = useState({ menuItems: [], totalAmount: 0 });

  // 테이블별 주문 필터링
  const getTableOrders = (tableNumber) => {
    return orders.filter(order => order.tableNumber === tableNumber);
  };

  // 주문 추가 처리
  const handleAddOrder = (tableNumber) => {
    if (newOrder.menuItems.length === 0) {
      alert('메뉴를 선택해주세요');
      return;
    }
    addOrder(tableNumber, newOrder.menuItems, newOrder.totalAmount);
    setNewOrder({ menuItems: [], totalAmount: 0 });
    setSelectedTable(null);
  };

  return (
    <div style={{ display: 'flex', color: '#222' }}>
      <div style={{ width: '20%', borderRight: '1px solid #ccc', padding: 10 }}>
        <h4>총 주문 현황</h4>
        <p>전체 주문: {orders.length}건</p>
        <p>진행 중: {orders.filter(order => order.status === '진행중').length}건</p>
      </div>
      <div style={{ width: '80%', padding: 10 }}>
        <input
          type="number"
          value={tableCount}
          onChange={(e) => setTableCount(Number(e.target.value))}
          placeholder="테이블 수 입력"
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          {[...Array(Number(tableCount))].map((_, idx) => {
            const tableNumber = idx + 1;
            const tableOrders = getTableOrders(tableNumber);
            const totalAmount = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0);

            return (
              <div key={idx} style={{ border: '1px solid #ddd', width: '30%', padding: 10 }}>
                <h5>테이블 {tableNumber}</h5>
                {tableOrders.length > 0 ? (
                  <>
                    <p>메뉴: {tableOrders.map(order => order.menuItems.join(', ')).join(', ')}</p>
                    <p>총액: {totalAmount.toLocaleString()}원</p>
                    <p>상태: {tableOrders[tableOrders.length - 1].status}</p>
                    <button 
                      onClick={() => updateOrderStatus(tableOrders[tableOrders.length - 1].id, '완료')}
                      style={{ marginTop: 5, padding: '5px 10px' }}
                    >
                      완료 처리
                    </button>
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