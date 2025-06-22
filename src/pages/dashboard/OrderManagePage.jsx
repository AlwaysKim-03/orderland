import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  getDoc,
  setDoc
} from 'firebase/firestore';

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

// 주문 아이템 파싱 유틸 함수
function getOrderItems(order) {
  let items = order.orders || order.items || [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  return Array.isArray(items) ? items : [];
}

// 주문 상세 모달
function OrderDetailModal({ isOpen, onClose, orders, tableNumber, storeId }) {
  const [menuList, setMenuList] = useState([]);
  const [menuQuantities, setMenuQuantities] = useState({});

  // 메뉴 리스트 불러오기
  useEffect(() => {
    if (!isOpen || !storeId) return;
    const fetchMenus = async () => {
      try {
        const q = query(collection(db, "products"), where("storeId", "==", storeId));
        const querySnapshot = await getDocs(q);
        const fetchedMenus = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMenuList(fetchedMenus);
      } catch (err) {
        console.error("메뉴 불러오기 실패:", err);
        setMenuList([]);
      }
    };
    fetchMenus();
  }, [isOpen, storeId]);

  if (!isOpen) return null;

  const total = orders.reduce((sum, order) => {
    const items = getOrderItems(order);
    return sum + items.reduce((s, item) => s + Number(item.price) * Number(item.quantity || 1), 0);
  }, 0);

  // 메뉴 추가 (기존 주문에 아이템 추가 또는 새 주문 생성)
  const handleAddMenu = async (menu) => {
    const qty = Math.max(1, Number(menuQuantities[menu.id]) || 1);
    
    // 기존 주문이 있을 경우
    if (orders.length > 0) {
      const primaryOrder = orders[0]; // 가장 최근 주문에 추가
      const orderRef = doc(db, "orders", primaryOrder.id);
      
      const newItems = [...getOrderItems(primaryOrder), { name: menu.name, price: menu.price, quantity: qty }];
      const newTotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      try {
        await updateDoc(orderRef, {
          orders: newItems,
          totalAmount: newTotal,
        });
      } catch (err) {
        console.error("메뉴 추가 실패:", err);
        alert("메뉴 추가에 실패했습니다.");
      }
    } else {
      // 기존 주문이 없을 경우 새 주문 생성
      try {
        await addDoc(collection(db, "orders"), {
          storeId: storeId,
          tableNumber: tableNumber,
          orders: [{ name: menu.name, price: menu.price, quantity: qty }],
          totalAmount: menu.price * qty,
          status: 'new',
          createdAt: new Date(),
        });
      } catch (err) {
        console.error("새 주문 생성 실패:", err);
        alert("새 주문 생성에 실패했습니다.");
      }
    }
    onClose(); // 성공 여부와 관계없이 모달을 닫아 데이터 리프레시
  };

  // 매출 집계 데이터 업데이트 함수
  async function updateSalesSummary(storeId, order) {
    try {
      const orderDate = order.createdAt.toDate();
      const today = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      
      // 오늘, 이번 주, 이번 달의 날짜 키 생성
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekKey = `week-${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      
      const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const periods = [
        { key: todayKey, period: 'today' },
        { key: weekKey, period: 'week' },
        { key: monthKey, period: 'month' }
      ];
      
      // 각 기간별로 집계 데이터 업데이트
      for (const { key, period } of periods) {
        const summaryRef = doc(db, "sales_summary", `${storeId}_${key}`);
        
        // 기존 집계 데이터 가져오기
        const summaryDoc = await getDoc(summaryRef);
        let summaryData = summaryDoc.exists() ? summaryDoc.data() : {
          storeId,
          dateKey: key,
          period,
          totalSales: 0,
          orderCount: 0,
          menuSales: {}
        };
        
        // 주문 데이터로 집계 업데이트
        const items = getOrderItems(order);
        const orderTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        summaryData.totalSales += orderTotal;
        summaryData.orderCount += 1;
        
        // 메뉴별 판매량 업데이트
        items.forEach(item => {
          if (!summaryData.menuSales[item.name]) {
            summaryData.menuSales[item.name] = { quantity: 0, total: 0 };
          }
          summaryData.menuSales[item.name].quantity += item.quantity;
          summaryData.menuSales[item.name].total += item.price * item.quantity;
        });
        
        // 집계 데이터 저장
        await setDoc(summaryRef, summaryData);
      }
    } catch (error) {
      console.error('매출 집계 업데이트 실패:', error);
    }
  }

  // 계산 완료 (주문 상태 변경)
  const handleCheckout = async () => {
    try {
      const batch = orders.map(order => updateDoc(doc(db, "orders", order.id), { status: 'completed' }));
      await Promise.all(batch);
      
      // 매출 집계 데이터 업데이트
      for (const order of orders) {
        await updateSalesSummary(storeId, order);
      }
      
      onClose();
    } catch (err) {
      console.error("계산 완료 처리 실패:", err);
      alert("계산 완료 처리에 실패했습니다.");
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, minWidth: 700, maxWidth: 900, width: '90%', display: 'flex', flexDirection: 'row', boxShadow: '0 4px 24px #0002', maxHeight: '85vh' }}>
        {/* 왼쪽: 주문내역 */}
        <div style={{ flex: 1.2, padding: 32, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, marginBottom: 24 }}>주문내역 (테이블 {tableNumber})</h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {orders.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', margin: '40px 0' }}>주문이 없습니다.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {orders.map((order) => 
                  getOrderItems(order).map((item, i) => (
                    <li key={`${order.id}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid #f1f1f1', paddingBottom: 8 }}>
                      <span>{item.name} x {item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString()}원</span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <div style={{ marginTop: 24, fontWeight: 700, fontSize: 20, textAlign: 'right' }}>총액: {total.toLocaleString()}원</div>
        </div>
        {/* 오른쪽: 메뉴리스트 */}
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <h4 style={{ margin: 0 }}>메뉴 추가</h4>
             <button onClick={onClose} style={{ background: 'none', color: '#888', border: 'none', fontSize: 28, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>×</button>
           </div>
          <div style={{ flex: 1, maxHeight: 450, overflowY: 'auto' }}>
            {menuList.length === 0 ? (
              <div>등록된 메뉴가 없습니다.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {menuList.map(menu => (
                  <li key={menu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #f1f1f1', paddingBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{menu.name}</span>
                      <span style={{ color: '#888', marginLeft: 8 }}>{Number(menu.price).toLocaleString()}원</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} defaultValue={1} onChange={e => setMenuQuantities(prev => ({ ...prev, [menu.id]: e.target.value }))} style={{ width: 48, marginRight: 4, border: '1px solid #ddd', borderRadius: 4, padding: '2px 6px' }} />
                      <button onClick={() => handleAddMenu(menu)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }}>추가</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
           <div style={{marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12}}>
              <button onClick={handleCheckout} style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 'bold' }}>계산 완료</button>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderManagePage({ orders: allOrders = [], userInfo, onUserUpdate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tableCount = userInfo?.tableCount || 0;
  const [tableCountInput, setTableCountInput] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    if (userInfo) {
      setTableCountInput(userInfo.tableCount || 0);
    }
  }, [userInfo]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
  
  // 테이블별로 주문 필터링 ('completed' 아닌 것만)
  const getTableOrders = useCallback((tableNumber) => {
    return allOrders
      .filter(order => order.tableNumber === tableNumber && order.status !== 'completed')
      .sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
  }, [allOrders]);

  // 주문 확인 처리 (상태를 'new' -> 'processing'으로 변경)
  const handleAcknowledgeOrder = async (orderId) => {
    try {
      const orderDocRef = doc(db, "orders", orderId);
      await updateDoc(orderDocRef, { status: 'processing' });
    } catch (error) {
      console.error("주문 확인 처리 실패:", error);
      alert('주문 확인 처리에 실패했습니다.');
    }
  };

  const handleTableClick = (tableNumber) => {
    setSelectedTable(tableNumber);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTable(null);
  };

  const newOrderTables = Array.from({ length: tableCount }, (_, i) => i + 1)
    .filter(tableNum => getTableOrders(tableNum).some(order => order.status === 'new'));

  // 실시간 주문 내역에 표시할 주문 필터링 ('new' 상태인 것만)
  const realtimeOrders = allOrders
    .filter(order => order.status === 'new')
    .sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));

  const handleTableCountSave = async () => {
    if (!currentUser) return alert('로그인이 필요합니다.');
    const newCount = Number(tableCountInput);
    if (isNaN(newCount) || newCount < 0) {
      return alert('올바른 테이블 수를 입력해주세요.');
    }
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, { tableCount: newCount });
      alert('테이블 수가 저장되었습니다.');
      if (onUserUpdate) {
        onUserUpdate();
      }
    } catch (error) {
      console.error('테이블 수 저장 실패:', error);
      alert('테이블 수 저장에 실패했습니다.');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row', 
      gap: '24px', 
      height: 'calc(100vh - 200px)' 
    }}>
      {/* 왼쪽: 테이블별 주문 현황 */}
      <div style={{ flex: 3, overflowY: 'auto', paddingRight: isMobile ? 0 : '16px' }}>
        <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '16px'}}>
          <h3>테이블별 주문 현황</h3>
          <div>
            <label>테이블 수: </label>
            <input 
              type="number" 
              value={tableCountInput}
              onChange={e => setTableCountInput(e.target.value)}
              style={{width: '60px', padding: '4px 8px', marginRight: '8px'}}
            />
            <button onClick={handleTableCountSave}>저장</button>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '20px',
        }}>
          {Array.from({ length: tableCount }, (_, i) => i + 1).map(tableNum => {
            const tableOrders = getTableOrders(tableNum);
            const items = tableOrders.flatMap(getOrderItems);
            const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
            const isNew = tableOrders.some(o => o.status === 'new');

            return (
              <div 
                key={tableNum} 
                onClick={() => handleTableClick(tableNum)}
                style={{
                  width: '180px',
                  height: '180px',
                  border: isNew ? '2px solid #f59e42' : '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '15px',
                  cursor: 'pointer',
                  background: tableOrders.length > 0 ? '#fff' : '#f9fafb',
                  boxShadow: tableOrders.length > 0 ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {tableNum}번
                </div>

                {items.length === 0 ? (
                  <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888', fontSize: '15px' }}>
                    비어있음
                  </div>
                ) : (
                  <div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '14px' }}>
                      {items.slice(0, 2).map((item, i) => (
                        <li key={i} style={{ marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {safeDecode(item.name)} x {item.quantity || 1}
                        </li>
                      ))}
                      {items.length > 2 && (
                        <li style={{ marginTop: '4px', color: '#666' }}>
                          그 외 {items.length - 2}건
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                {items.length > 0 && (
                  <div style={{ textAlign: 'right', marginTop: '8px', fontWeight: 'bold', fontSize: '15px' }}>
                    {total.toLocaleString()}원
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 오른쪽: 실시간 주문 내역 */}
      <div style={{ flex: 2, borderLeft: isMobile ? 'none' : '1px solid #eee', borderTop: isMobile ? '1px solid #eee' : 'none', paddingLeft: isMobile ? 0 : '24px', paddingTop: isMobile ? '24px' : 0, overflowY: 'auto' }}>
        <h3>실시간 주문 내역</h3>
        {realtimeOrders.length === 0 ? (
          <div>신규 주문이 없습니다.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {realtimeOrders.map(order => (
              <li key={order.id} style={{ borderBottom: '1px solid #f1f1f1', padding: '12px 0' }}>
                <div style={{ fontWeight: 'bold' }}>{order.tableNumber}번 테이블</div>
                <div>{new Date(order.createdAt?.toDate()).toLocaleString()}</div>
                <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                  {getOrderItems(order).map((item, index) => (
                    <li key={index}>{item.name} x {item.quantity}</li>
                  ))}
                </ul>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>총 {order.totalAmount.toLocaleString()}원</span>
                  <button 
                    onClick={() => handleAcknowledgeOrder(order.id)}
                    style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold' }}>
                    확인
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        orders={selectedTable ? getTableOrders(selectedTable) : []}
        tableNumber={selectedTable}
        storeId={currentUser?.uid}
      />
    </div>
  );
} 