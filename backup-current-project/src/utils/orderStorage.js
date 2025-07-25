// 주문 내역 관리를 위한 유틸리티 함수들

// 주문 내역 저장
export const saveOrderHistory = (tableId, orders) => {
  const key = `orderHistory_${tableId}`;
  localStorage.setItem(key, JSON.stringify(orders));
};

// 주문 내역 불러오기
export const getOrderHistory = (tableId) => {
  const key = `orderHistory_${tableId}`;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

// 주문 내역 추가
export const addOrder = (tableId, order) => {
  const orders = getOrderHistory(tableId);
  orders.push({
    ...order,
    timestamp: new Date().toISOString(),
    id: Date.now().toString()
  });
  saveOrderHistory(tableId, orders);
};

// 주문 내역 삭제
export const removeOrder = (tableId, orderId) => {
  const orders = getOrderHistory(tableId);
  const updatedOrders = orders.filter(order => order.id !== orderId);
  saveOrderHistory(tableId, updatedOrders);
};

// 주문 내역 초기화
export const clearOrderHistory = (tableId) => {
  const key = `orderHistory_${tableId}`;
  localStorage.removeItem(key);
};

// 모든 주문 내역 초기화
export const clearAllOrderHistory = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('orderHistory_')) {
      localStorage.removeItem(key);
    }
  });
};

// 주문 내역 업데이트
export const updateOrder = (tableId, orderId, updates) => {
  const orders = getOrderHistory(tableId);
  const updatedOrders = orders.map(order => 
    order.id === orderId ? { ...order, ...updates } : order
  );
  saveOrderHistory(tableId, updatedOrders);
}; 