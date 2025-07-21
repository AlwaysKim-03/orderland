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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

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
function OrderDetailModal({ isOpen, onClose, orders, tableNumber, storeId, onServeConfirm, processingOrders }) {
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
      
      const currentItems = getOrderItems(primaryOrder);
      const newItems = [...currentItems, { id: menu.id, name: menu.name, price: Number(menu.price), quantity: qty }];
      const newTotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      try {
        await updateDoc(orderRef, {
          items: newItems,
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
          items: [{ id: menu.id, name: menu.name, price: Number(menu.price), quantity: qty }],
          totalAmount: Number(menu.price) * qty,
          status: 'new',
          createdAt: new Date(),
        });
      } catch (err) {
        console.error("새 주문 생성 실패:", err);
        alert("새 주문 생성에 실패했습니다.");
      }
    }
    // onClose(); // 성공 여부와 관계없이 모달을 닫아 데이터 리프레시 -> 사용자의 요청으로 주석 처리
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '600px', maxHeight: '80vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>테이블 {tableNumber} 주문 상세</h3>
        
        {/* 주문 목록 */}
        <div style={{ marginBottom: '20px' }}>
          <h4>주문 내역</h4>
          {orders.map((order, index) => {
            const items = getOrderItems(order);
            return (
              <div key={order.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>주문 #{index + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    backgroundColor: order.status === 'completed' ? '#dcfce7' : '#fef3c7',
                    color: order.status === 'completed' ? '#166534' : '#92400e'
                  }}>
                    {order.status === 'completed' ? '완료' : '대기'}
                  </span>
                    {order.status !== 'completed' && order.status !== 'served' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingOrders.has(order.id)}
                        onClick={() => onServeConfirm(order.id)}
                        className="gap-2"
                      >
                        {processingOrders.has(order.id) ? (
                          <>처리중...</>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            서빙 완료
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {items.map((item, itemIndex) => (
                  <div key={itemIndex} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>{item.name} x{item.quantity}</span>
                    <span>₩{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                  소계: ₩{items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                </div>
              </div>
            );
          })}
          <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: 'bold', marginTop: '15px' }}>
            총액: ₩{total.toLocaleString()}
          </div>
        </div>

        {/* 메뉴 추가 */}
        <div style={{ marginBottom: '20px' }}>
          <h4>메뉴 추가</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {menuList.map(menu => (
              <div key={menu.id} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '6px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>{menu.name}</strong>
                  <br />
                  <span style={{ color: '#666' }}>₩{menu.price.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    value={menuQuantities[menu.id] || 1}
                    onChange={(e) => setMenuQuantities(prev => ({ ...prev, [menu.id]: e.target.value }))}
                    style={{ width: '50px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <button
                    onClick={() => handleAddMenu(menu)}
                    style={{ 
                      padding: '4px 8px', 
                      background: '#3b82f6', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    추가
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            닫기
          </button>
          <button onClick={handleCheckout} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            계산 완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderManagePage({ orders: allOrders = [], userInfo, onUserUpdate }) {
  const [tableCount, setTableCount] = useState(userInfo?.tableCount || 15);
  const [isEditingTableCount, setIsEditingTableCount] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gridLayout, setGridLayout] = useState('5x3');
  const [processingOrders, setProcessingOrders] = useState(new Set());

  // 테이블별 주문 그룹화
  const tableOrders = {};
  allOrders.forEach(order => {
    const tableNum = order.tableNumber;
    if (!tableOrders[tableNum]) {
      tableOrders[tableNum] = [];
    }
    tableOrders[tableNum].push(order);
  });

  // 테이블별 매출 계산
  const tableSales = {};
  Object.keys(tableOrders).forEach(tableNum => {
    tableSales[tableNum] = tableOrders[tableNum].reduce((sum, order) => {
      const items = getOrderItems(order);
      return sum + items.reduce((s, item) => s + (item.price * item.quantity), 0);
    }, 0);
  });

  // 테이블별 주문 수 계산
  const tableOrderCounts = {};
  Object.keys(tableOrders).forEach(tableNum => {
    tableOrderCounts[tableNum] = tableOrders[tableNum].length;
  });

  // 테이블 상태 계산
  const getTableStatus = (tableNum) => {
    const orders = tableOrders[tableNum] || [];
    if (orders.length === 0) return 'empty';
    
    const hasActiveOrders = orders.some(order => order.status !== 'completed');
    if (hasActiveOrders) {
      const hasCookingOrders = orders.some(order => order.status === 'cooking');
      return hasCookingOrders ? 'cooking' : 'in-use';
    }
    return 'empty';
  };

  const handleAcknowledgeOrder = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: 'acknowledged' });
    } catch (error) {
      console.error("주문 확인 실패:", error);
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

  const handleTableCountSave = async () => {
    if (!userInfo?.uid) return;
    
    try {
      await updateDoc(doc(db, "users", userInfo.uid), { tableCount: Number(tableCount) });
      setIsEditingTableCount(false);
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      console.error("테이블 수 업데이트 실패:", error);
      alert("테이블 수 업데이트에 실패했습니다.");
    }
  };

  // 매출 집도에 따른 색상 계산
  const getSalesIntensity = (sales) => {
    const maxSales = Math.max(...Object.values(tableSales), 1);
    const percentage = (sales / maxSales) * 100;
    
    if (percentage > 80) return 'border-red-500/30 bg-gradient-to-br from-red-50 to-red-100/50';
    if (percentage > 60) return 'border-orange-500/30 bg-gradient-to-br from-orange-50 to-orange-100/50';
    if (percentage > 40) return 'border-yellow-500/30 bg-gradient-to-br from-yellow-50 to-yellow-100/50';
    if (percentage > 20) return 'border-green-500/30 bg-gradient-to-br from-green-50 to-green-100/50';
    return 'border-gray-200 bg-white';
  };

  // 상태에 따른 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'in-use': return 'bg-red-500 text-white';
      case 'cooking': return 'bg-yellow-500 text-white';
      case 'empty': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // 상태에 따른 색상
  const getStatusText = (status) => {
    switch (status) {
      case 'in-use': return '사용중';
      case 'cooking': return '조리중';
      case 'empty': return '빈테이블';
      default: return '빈테이블';
    }
  };

  // 그리드 크기 계산
  const gridSize = 5; // 5x3 그리드
  const totalTables = Math.max(tableCount, 15);

  // 서빙 확인 처리
  const handleServeConfirm = async (orderId) => {
    setProcessingOrders(prev => new Set(prev).add(orderId));
    
    try {
      await updateDoc(doc(db, "orders", orderId), { status: 'served' });
      toast.success('서빙이 완료되었습니다.');
    } catch (error) {
      console.error("서빙 확인 실패:", error);
      toast.error('서빙 확인에 실패했습니다.');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // 그리드 레이아웃 변경
  const handleGridLayoutChange = (layout) => {
    setGridLayout(layout);
  };

  // 그리드 클래스 계산
  const getGridClasses = (layout) => {
    switch (layout) {
      case '5x3': return 'grid-cols-5 max-h-[600px]';
      case '5x5': return 'grid-cols-5 max-h-[1000px]';
      case '5x10': return 'grid-cols-5 max-h-[2000px]';
      default: return 'grid-cols-5 max-h-[600px]';
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">주문 현황</h2>
          <p className="text-muted-foreground">
        테이블별 실시간 주문 상태를 확인하세요
      </p>
        </div>
        
        {/* 그리드 레이아웃 선택기 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg" className="gap-2">
              <LayoutGrid className="w-5 h-5" />
              그리드 변경 ({gridLayout})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleGridLayoutChange('5x3')}>
              5x3 그리드
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGridLayoutChange('5x5')}>
              5x5 그리드
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGridLayoutChange('5x10')}>
              5x10 그리드
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">총 테이블</div>
          <div className="text-2xl font-bold">{tableCount}개</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">사용중</div>
          <div className="text-2xl font-bold text-red-500">
            {Object.keys(tableOrders).filter(tableNum => getTableStatus(tableNum) === 'in-use').length}개
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">조리중</div>
          <div className="text-2xl font-bold text-yellow-500">
            {Object.keys(tableOrders).filter(tableNum => getTableStatus(tableNum) === 'cooking').length}개
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">빈테이블</div>
          <div className="text-2xl font-bold text-gray-500">
            {tableCount - Object.keys(tableOrders).filter(tableNum => getTableStatus(tableNum) !== 'empty').length}개
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">총 매출</div>
          <div className="text-2xl font-bold text-primary">
            ₩{Object.values(tableSales).reduce((sum, sales) => sum + sales, 0).toLocaleString()}
          </div>
        </Card>
      </div>

      {/* 테이블 그리드 */}
      <Card className="p-6">
        <div className={`grid ${getGridClasses(gridLayout)} gap-4 overflow-y-auto`}>
          {Array.from({ length: totalTables }, (_, index) => {
            const tableNumber = index + 1;
            const status = getTableStatus(tableNumber);
            const sales = tableSales[tableNumber] || 0;
            const orderCount = tableOrderCounts[tableNumber] || 0;
            const salesPercentage = Math.min((sales / 200000) * 100, 100);
            
            return (
              <Card 
                key={tableNumber}
                onClick={() => handleTableClick(tableNumber)}
                className={`
                  relative p-4 min-h-[140px] cursor-pointer transition-all duration-200 
                  hover:scale-105 hover:shadow-lg border-2
                  ${getSalesIntensity(sales)}
                `}
              >
                {/* 상태 배지 */}
                <Badge className={`absolute top-2 right-2 ${getStatusColor(status)}`}>
                  {getStatusText(status)}
                </Badge>
                
                {/* 테이블 번호 */}
                <div className="text-lg font-bold text-foreground mb-2">
                  Table {String(tableNumber).padStart(2, '0')}
                </div>
                
                {/* 매출 정보 */}
                <div className="mb-2">
                  <div className="text-xl font-bold text-primary">
                    ₩{sales.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    오늘 매출
                  </div>
                </div>
                
                {/* 주문 수 */}
                {orderCount > 0 && (
                  <div className="text-xs text-muted-foreground mb-2">
                    {orderCount}건 주문
                  </div>
                )}
                
                {/* 매출 인디케이터 바 */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${salesPercentage}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* 하단 안내 */}
      <div className="text-center text-muted-foreground text-sm">
        현재 {gridLayout} 그리드 보기 • 색상이 진할수록 매출이 높은 테이블입니다
      </div>

      {/* 모달 */}
      {isModalOpen && selectedTable && (
        <OrderDetailModal
          isOpen={isModalOpen}
          onClose={closeModal}
          orders={tableOrders[selectedTable] || []}
          tableNumber={selectedTable}
          storeId={userInfo?.uid}
          onServeConfirm={handleServeConfirm}
          processingOrders={processingOrders}
        />
      )}
    </div>
  );
} 