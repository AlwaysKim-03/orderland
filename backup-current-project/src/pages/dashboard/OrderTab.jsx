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

export default function OrderTab({ orders = [], userInfo }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [newOrder, setNewOrder] = useState({ menuItems: [], totalAmount: 0 });
  const [tableCount, setTableCount] = useState(userInfo?.tableCount || 15);
  const storeSlug = localStorage.getItem('restaurantName');

  // userInfo가 변경되면 테이블 수 업데이트
  useEffect(() => {
    if (userInfo?.tableCount) {
      setTableCount(userInfo.tableCount);
    }
  }, [userInfo]);

  const getTableOrders = (tableNumber) => {
    const myTableKey = getTableKey(storeSlug, tableNumber);
    return orders.filter(order => order.tableNumber === myTableKey);
  };

  // 주문 삭제
  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/custom/v1/orders/delete-order`, { orderId });
      // 삭제 후 목록 새로고침
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/custom/v1/orders?storeSlug=${storeSlug}`);
      // 주문 목록은 부모 컴포넌트에서 관리하므로 여기서는 새로고침하지 않음
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
      await axios.post(`${import.meta.env.VITE_API_URL}/custom/v1/orders`, {
        storeSlug,
        tableNumber: getTableKey(storeSlug, tableNumber),
        orders: ordersArr,
        totalAmount: ordersArr.reduce((sum, item) => sum + item.price * item.quantity, 0)
      });
      setNewOrder({ menuItems: [], totalAmount: 0 });
      setSelectedTable(null);
      alert('주문이 추가되었습니다!');
    } catch (err) {
      alert('주문 추가 실패: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="content">
      <div className="card mb-8">
        <div className="card-header">
          <div className="card-title">주문 현황</div>
          <div className="card-subtitle">테이블별 주문 현황을 확인하고 관리하세요</div>
        </div>
        <div className="card-content">
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">테이블 수:</label>
              <input
                type="number"
                value={tableCount}
                onChange={(e) => {
                  let val = e.target.value.replace(/^0+/, '');
                  setTableCount(val === '' ? 0 : Number(val));
                }}
                className="input w-20"
                min="1"
                max="50"
              />
            </div>
            <div className="text-sm text-gray-600">
              전체 주문: {orders.length}건 | 
              진행 중: {orders.filter(order => order.status === '진행중' || order.status === 'new' || order.status === 'processing').length}건
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(Math.max(1, tableCount))].map((_, idx) => {
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
                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <h5 className="font-semibold text-gray-900 mb-3">테이블 {tableNumber}</h5>
                  {tableOrders.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        메뉴: {menuList.length > 0 ? menuList.join(', ') : '없음'}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        총액: ₩{totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        상태: {lastStatus}
                      </p>
                      {lastOrderId && (
                        <button 
                          onClick={() => handleDeleteOrder(lastOrderId)} 
                          className="w-full btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                        >
                          주문 삭제
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-2">메뉴: 없음</p>
                      <p className="text-sm text-gray-500 mb-3">총액: ₩0</p>
                      <button 
                        onClick={() => setSelectedTable(tableNumber)}
                        className="w-full btn btn-sm btn-secondary"
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
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold mb-4">테이블 {selectedTable} 주문하기</h4>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="메뉴 입력 (Enter로 추가)"
                    className="input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const menuItem = e.target.value;
                        if (menuItem.trim()) {
                          setNewOrder({
                            menuItems: [...newOrder.menuItems, menuItem],
                            totalAmount: newOrder.totalAmount + 10000 // 임시 가격
                          });
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAddOrder(selectedTable)}
                    className="btn btn-primary"
                    disabled={newOrder.menuItems.length === 0}
                  >
                    주문 추가
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTable(null);
                      setNewOrder({ menuItems: [], totalAmount: 0 });
                    }}
                    className="btn btn-secondary"
                  >
                    취소
                  </button>
                </div>
                {newOrder.menuItems.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <p className="font-medium mb-2">선택된 메뉴: {newOrder.menuItems.join(', ')}</p>
                    <p className="text-lg font-semibold text-primary">총액: ₩{newOrder.totalAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 