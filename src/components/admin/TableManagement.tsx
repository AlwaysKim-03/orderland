import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useOrderNotification } from "@/contexts/OrderNotificationContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, QrCode, Clock, ChefHat, CheckCircle2, Trash2, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrderEditSheet } from "./OrderEditSheet";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface TableData {
  id: number;
  name: string;
  status: 'empty' | 'ordered' | 'cooking' | 'ready' | 'completed';
  orderCount: number;
  qrUrl: string;
  orderTime?: string;
}

interface TableOrder {
  id: string;
  menuName: string;
  quantity: number;
  price: number;
  status: 'new' | 'cooking' | 'ready' | 'served';
  orderTime: string;
}

interface FirebaseOrder {
  id: string;
  tableNumber: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  status: string;
  createdAt: any;
  totalAmount: number;
}

export function TableManagement() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { pendingOrders, removePendingOrder } = useOrderNotification();
  
  // Load tables from localStorage on component mount
  const loadTablesFromStorage = () => {
    try {
      const stored = localStorage.getItem('orderland-tables');
      if (stored) {
        const parsedTables = JSON.parse(stored);
        return Array.isArray(parsedTables) ? parsedTables : [];
      }
    } catch (error) {
      console.error('Error loading tables from storage:', error);
    }
    return [];
  };

  const [tables, setTables] = useState<TableData[]>(loadTablesFromStorage);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tableCount, setTableCount] = useState([0]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteTableId, setDeleteTableId] = useState<number | null>(null);
  const [endOrderTableId, setEndOrderTableId] = useState<number | null>(null);
  const [tableOrders, setTableOrders] = useState<Record<number, TableOrder[]>>({});
  const [firebaseOrders, setFirebaseOrders] = useState<FirebaseOrder[]>([]);

  // Firebase에서 실시간 주문 데이터 가져오기
  useEffect(() => {
    console.log('Firebase 주문 데이터 로딩 시작...');
    
    let unsubscribe: (() => void) | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    const setupListener = () => {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
          console.log('Firebase 주문 스냅샷 받음:', snapshot.docs.length, '개 문서');
          retryCount = 0;
          
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FirebaseOrder[];
          
          console.log('Firebase 주문 데이터:', ordersData);
          setFirebaseOrders(ordersData);
          
          // Firebase 주문 데이터를 테이블별 주문으로 변환
          const convertedTableOrders: Record<number, TableOrder[]> = {};
          
          ordersData.forEach(order => {
            const tableNumber = parseInt(order.tableNumber);
            if (!isNaN(tableNumber)) {
              if (!convertedTableOrders[tableNumber]) {
                convertedTableOrders[tableNumber] = [];
              }
              
              // 각 주문 아이템을 개별 TableOrder로 변환
              order.items.forEach((item, index) => {
                const tableOrder: TableOrder = {
                  id: `${order.id}-${index}`,
                  menuName: item.name,
                  quantity: item.quantity,
                  price: item.price,
                  status: order.status === 'new' ? 'new' : 
                         order.status === 'preparing' ? 'cooking' : 
                         order.status === 'ready' ? 'ready' : 
                         order.status === 'served' ? 'served' : 'cooking',
                  orderTime: order.createdAt?.toDate?.() ? 
                    order.createdAt.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) :
                    new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                };
                
                convertedTableOrders[tableNumber].push(tableOrder);
              });
            }
          });
          
          console.log('변환된 테이블별 주문:', convertedTableOrders);
          setTableOrders(convertedTableOrders);
          
          // 테이블 상태 업데이트
          updateTableStatuses(convertedTableOrders, ordersData);
        }, (error) => {
          console.error('Firebase 주문 데이터 로드 오류:', error);
          
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`재시도 ${retryCount}/${maxRetries}...`);
            
            setTimeout(() => {
              if (unsubscribe) {
                unsubscribe();
              }
              setupListener();
            }, 2000 * retryCount);
          } else {
            console.error('최대 재시도 횟수 초과. 실시간 주문 감지를 중단합니다.');
          }
        });
      } catch (error) {
        console.error('Firebase 리스너 설정 오류:', error);
      }
    };
    
    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 테이블 상태 업데이트 함수
  const updateTableStatuses = (orders: Record<number, TableOrder[]>, currentFirebaseOrders: FirebaseOrder[]) => {
    setTables(prevTables => prevTables.map(table => {
      const tableOrderList = orders[table.id] || [];
      
      if (tableOrderList.length === 0) {
        return {
          ...table,
          status: 'empty' as const,
          orderCount: 0,
          orderTime: undefined
        };
      }
      
      // Firebase 주문에서 해당 테이블의 주문 상태 확인
      const tableFirebaseOrders = currentFirebaseOrders.filter(order => 
        parseInt(order.tableNumber) === table.id
      );
      
      // 주문 상태에 따른 테이블 상태 결정
      let tableStatus: TableData['status'] = 'ordered';
      
      // Firebase 주문 상태를 우선 확인
      const hasNewOrders = tableFirebaseOrders.some(order => order.status === 'new');
      const hasPreparingOrders = tableFirebaseOrders.some(order => order.status === 'preparing');
      const hasReadyOrders = tableFirebaseOrders.some(order => order.status === 'ready');
      const hasServedOrders = tableFirebaseOrders.some(order => order.status === 'served');
      
      if (hasNewOrders) {
        tableStatus = 'ordered'; // 대기 상태
      } else if (hasReadyOrders) {
        tableStatus = 'ready';
      } else if (hasPreparingOrders) {
        tableStatus = 'cooking'; // preparing 상태를 cooking으로 매핑
      } else if (hasServedOrders) {
        tableStatus = 'completed';
      }
      
      return {
        ...table,
        status: tableStatus,
        orderCount: tableOrderList.length,
        orderTime: tableOrderList[0]?.orderTime
      };
    }));
  };

  // Save tables to localStorage whenever tables change
  const saveTablestoStorage = (newTables: TableData[]) => {
    try {
      localStorage.setItem('orderland-tables', JSON.stringify(newTables));
    } catch (error) {
      console.error('Error saving tables to storage:', error);
    }
  };

  // Persist tables to localStorage whenever tables state changes
  useEffect(() => {
    saveTablestoStorage(tables);
    window.dispatchEvent(new CustomEvent('tablesUpdated'));
  }, [tables]);

  // Generate sample tables with realistic data
  const generateTables = (count: number) => {
    const newTables: TableData[] = [];
    const statuses: TableData['status'][] = ['empty', 'ordered', 'cooking', 'ready', 'completed'];
    
    for (let i = 1; i <= count; i++) {
      let randomStatus: TableData['status'];
      if (i <= 3) {
        randomStatus = i === 1 ? 'ready' : i === 2 ? 'completed' : 'ready';
      } else if (i <= 7) {
        randomStatus = statuses[Math.floor(Math.random() * 5)];
      } else {
        randomStatus = 'empty';
      }
      
      const orderCount = randomStatus === 'empty' ? 0 : Math.floor(Math.random() * 3) + 1;
      
      newTables.push({
        id: i,
        name: `T-${i.toString().padStart(2, '0')}`,
        status: randomStatus,
        orderCount,
        qrUrl: `${window.location.origin}/order/donkatsu/${i.toString().padStart(2, '0')}`,
        orderTime: orderCount > 0 ? `${13 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : undefined
      });
    }
    
    return newTables;
  };

  const getNextTableNumber = () => {
    if (tables.length === 0) return 1;
    return Math.max(...tables.map(t => t.id)) + 1;
  };

  const handleAddSingleTable = () => {
    const nextId = getNextTableNumber();
    const newTable: TableData = {
      id: nextId,
      name: `T-${nextId.toString().padStart(2, '0')}`,
      status: 'empty',
      orderCount: 0,
      qrUrl: `${window.location.origin}/order/donkatsu/${nextId.toString().padStart(2, '0')}`,
    };
    
    setTables(prev => [...prev, newTable]);
    
    toast({
      title: "테이블 추가 완료",
      description: `${newTable.name} 테이블이 추가되었습니다. QR 코드도 자동 생성되었습니다.`,
    });
  };

  const handleDeleteTable = (tableId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTableId(tableId);
  };

  const confirmDeleteTable = () => {
    if (!deleteTableId) return;
    
    const tableToDelete = tables.find(t => t.id === deleteTableId);
    setTables(prev => prev.filter(t => t.id !== deleteTableId));
    setDeleteTableId(null);
    
    toast({
      title: "테이블 삭제 완료",
      description: `${tableToDelete?.name} 테이블이 삭제되었습니다. QR 코드도 함께 제거되었습니다.`,
    });
  };

  const handleAddTables = () => {
    const newTables = generateTables(tableCount[0]);
    setTables(newTables);
    setIsAddModalOpen(false);
    
    toast({
      title: "테이블 추가 완료",
      description: `총 ${tableCount[0]}개의 테이블이 추가되었습니다. QR 코드도 자동 생성되었습니다.`,
    });
  };

  const handleTableClick = (table: TableData) => {
    if (table.status === 'empty') return;
    
    setSelectedTable(table);
    setIsDetailOpen(true);
  };

  const handleOrderConfirm = async () => {
    if (!selectedTable) return;
    
    console.log('=== handleOrderConfirm 시작 ===');
    console.log('선택된 테이블:', selectedTable);
    console.log('현재 firebaseOrders:', firebaseOrders);
    console.log('현재 pendingOrders:', Array.from(pendingOrders));
    
    try {
      // Firebase 주문 상태 업데이트 - tableNumber 비교 로직 개선
      const tableFirebaseOrders = firebaseOrders.filter(order => {
        const orderTableNumber = parseInt(order.tableNumber);
        const selectedTableId = selectedTable.id;
        
        console.log('테이블 번호 비교:', {
          orderTableNumber: orderTableNumber,
          selectedTableId: selectedTableId,
          orderTableNumberString: order.tableNumber,
          selectedTableIdString: selectedTable.id.toString(),
          isMatch: orderTableNumber === selectedTableId,
          orderStatus: order.status
        });
        
        return orderTableNumber === selectedTableId && order.status === 'new';
      });
      
      console.log('업데이트할 주문들:', tableFirebaseOrders);
      
      if (tableFirebaseOrders.length === 0) {
        console.log('업데이트할 주문이 없습니다!');
        console.log('가능한 원인:');
        console.log('1. 해당 테이블의 주문이 없음');
        console.log('2. 주문 상태가 이미 "new"가 아님');
        console.log('3. tableNumber 타입 불일치');
        
        toast({
          title: "업데이트할 주문이 없습니다",
          description: "이미 처리된 주문이거나 새로운 주문이 없습니다.",
          variant: "destructive",
        });
        return;
      }
      
      // 해당 테이블의 'new' 상태 주문을 'preparing' 상태로 업데이트
      const updatePromises = tableFirebaseOrders.map(order => 
        updateDoc(doc(db, 'orders', order.id), {
          status: 'preparing',
          updatedAt: new Date()
        })
      );
      
      await Promise.all(updatePromises);
      
      console.log('Firebase 주문 상태 업데이트 완료:', tableFirebaseOrders.length, '개 주문');
      
      // pendingOrders에서 해당 테이블 제거 (애니메이션 멈춤)
      console.log('pendingOrders에서 테이블 제거:', selectedTable.id.toString());
      removePendingOrder(selectedTable.id.toString());
      
      // 로컬 firebaseOrders 상태 즉시 업데이트
      setFirebaseOrders(prev => {
        const updated = prev.map(order => {
          const orderTableNumber = parseInt(order.tableNumber);
          const shouldUpdate = orderTableNumber === selectedTable.id && order.status === 'new';
          
          if (shouldUpdate) {
            console.log('firebaseOrders 업데이트:', {
              orderId: order.id,
              beforeStatus: order.status,
              afterStatus: 'preparing'
            });
            return { ...order, status: 'preparing' };
          }
          return order;
        });
        
        console.log('firebaseOrders 업데이트 완료');
        return updated;
      });
      
      // tableOrders 상태도 즉시 업데이트
      setTableOrders(prev => {
        const tableOrderList = prev[selectedTable.id] || [];
        const updatedTableOrders = tableOrderList.map(order => ({
          ...order,
          status: order.status === 'new' ? 'cooking' : order.status
        }));
        
        console.log('tableOrders 업데이트:', {
          tableId: selectedTable.id,
          before: tableOrderList,
          after: updatedTableOrders
        });
        
        return {
          ...prev,
          [selectedTable.id]: updatedTableOrders
        };
      });
      
      // 테이블 상태를 즉시 'cooking'으로 업데이트 (애니메이션 멈춤, 상태 변경)
      setTables(prev => {
        const updatedTables = prev.map(table => 
          table.id === selectedTable.id 
            ? { ...table, status: 'cooking' as const }
            : table
        );
        
        console.log('tables 업데이트:', {
          tableId: selectedTable.id,
          before: prev.find(t => t.id === selectedTable.id)?.status,
          after: 'cooking'
        });
        
        return updatedTables;
      });
      
      console.log('=== handleOrderConfirm 완료 ===');
      
      toast({
        title: "주문 확인 완료",
        description: `${selectedTable.name} 테이블의 주문이 조리 상태로 변경되었습니다.`,
      });
      
      // Sheet는 그대로 열려있도록 유지 (닫지 않음)
      // setIsDetailOpen(false);
      // setSelectedTable(null);
    } catch (error) {
      console.error('주문 상태 업데이트 오류:', error);
      toast({
        title: "주문 확인 실패",
        description: "주문 상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleOrdersUpdate = (tableId: number, orders: TableOrder[]) => {
    console.log('주문 업데이트:', tableId, orders);
    
    setTableOrders(prev => ({
      ...prev,
      [tableId]: orders
    }));
    
    // 테이블 상태 업데이트는 Firebase 리스너에서 자동으로 처리됨
    // 별도로 호출할 필요 없음
  };

  const handleOrderEnd = (tableId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEndOrderTableId(tableId);
  };

  const confirmOrderEnd = async () => {
    if (!endOrderTableId) return;
    
    const tableToEnd = tables.find(t => t.id === endOrderTableId);
    
    try {
      console.log('=== 주문 종료 시작 ===');
      console.log('종료할 테이블:', endOrderTableId);
      console.log('현재 firebaseOrders:', firebaseOrders);
      
      // Firebase에서 해당 테이블의 모든 주문 삭제 - 타입 비교 수정
      const ordersToDelete = firebaseOrders.filter(order => {
        const orderTableNumber = parseInt(order.tableNumber);
        const tableId = endOrderTableId;
        
        console.log('주문 종료 - 테이블 번호 비교:', {
          orderTableNumber: orderTableNumber,
          tableId: tableId,
          orderTableNumberString: order.tableNumber,
          tableIdString: endOrderTableId.toString(),
          isMatch: orderTableNumber === tableId
        });
        
        return orderTableNumber === tableId;
      });
      
      console.log('삭제할 주문들:', ordersToDelete);
      
      if (ordersToDelete.length === 0) {
        console.log('삭제할 주문이 없습니다.');
      } else {
        // Firebase에서 주문들을 비동기적으로 삭제
        const deletePromises = ordersToDelete.map(order => 
          deleteDoc(doc(db, 'orders', order.id))
        );
        
        await Promise.all(deletePromises);
        console.log('Firebase 주문 삭제 완료:', ordersToDelete.length, '개 주문');
      }
      
      // Reset table to empty state
      setTables(prev => prev.map(table => 
        table.id === endOrderTableId 
          ? { 
              ...table, 
              status: 'empty' as const, 
              orderCount: 0, 
              orderTime: undefined 
            }
          : table
      ));
      
      // Clear any pending notifications for this table
      removePendingOrder(endOrderTableId.toString());
      
      // Clear table orders
      setTableOrders(prev => {
        const newTableOrders = { ...prev };
        delete newTableOrders[endOrderTableId];
        return newTableOrders;
      });
      
      // localStorage에서 해당 테이블의 장바구니 데이터 삭제
      try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cart-') && key.includes(`-${endOrderTableId}`)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log('장바구니 데이터 삭제:', key);
        });
        
        if (keysToRemove.length === 0) {
          console.log('삭제할 장바구니 데이터가 없습니다.');
        }
      } catch (error) {
        console.error('localStorage 장바구니 데이터 삭제 오류:', error);
      }
      
      console.log('=== 주문 종료 완료 ===');
      
      setEndOrderTableId(null);
      setIsDetailOpen(false);
      setSelectedTable(null);
      
      // Trigger table reset event for customer-side
      window.dispatchEvent(new CustomEvent('orderEnded', { 
        detail: { tableId: endOrderTableId } 
      }));
      
      toast({
        title: "주문 종료 완료",
        description: `${tableToEnd?.name} 테이블의 주문이 성공적으로 종료되었습니다. 다음 손님을 위해 초기화되었어요.`,
      });
    } catch (error) {
      console.error('주문 종료 오류:', error);
      toast({
        title: "주문 종료 실패",
        description: "주문 종료 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleOrderDelete = async (orderId: string, menuName: string) => {
    console.log('주문 삭제 시작:', orderId, menuName);
    
    try {
      // Firebase 주문에서 해당 아이템 제거
      const orderIdParts = orderId.split('-');
      const firebaseOrderId = orderIdParts[0];
      const itemIndex = parseInt(orderIdParts[1]);
      
      console.log('주문 삭제 - 파싱된 정보:', {
        firebaseOrderId: firebaseOrderId,
        itemIndex: itemIndex,
        orderIdParts: orderIdParts
      });
      
      const firebaseOrder = firebaseOrders.find(order => order.id === firebaseOrderId);
      
      if (firebaseOrder && !isNaN(itemIndex)) {
        console.log('삭제할 주문 찾음:', firebaseOrder);
        
        const updatedItems = firebaseOrder.items.filter((_, index) => index !== itemIndex);
        
        console.log('업데이트된 아이템:', {
          before: firebaseOrder.items,
          after: updatedItems,
          removedIndex: itemIndex
        });
        
        if (updatedItems.length === 0) {
          // 모든 아이템이 삭제되면 주문을 완료 상태로 변경
          await updateDoc(doc(db, 'orders', firebaseOrderId), {
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          });
          console.log('모든 아이템 삭제됨 - 주문 완료 상태로 변경');
        } else {
          // 일부 아이템만 삭제된 경우 주문 업데이트
          const newTotalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          await updateDoc(doc(db, 'orders', firebaseOrderId), {
            items: updatedItems,
            totalAmount: newTotalAmount,
            updatedAt: new Date()
          });
          console.log('일부 아이템 삭제됨 - 주문 업데이트 완료');
        }
        
        console.log('Firebase 주문 삭제 완료:', orderId);
        
        // 로컬 상태 업데이트는 Firebase 리스너에서 자동으로 처리됨
      } else {
        console.error('삭제할 주문을 찾을 수 없음:', {
          firebaseOrderId: firebaseOrderId,
          firebaseOrder: firebaseOrder,
          itemIndex: itemIndex
        });
      }
    } catch (error) {
      console.error('Firebase 주문 삭제 오류:', error);
    }
  };

  const getStatusColor = (status: TableData['status']) => {
    switch (status) {
      case 'empty': return 'bg-muted text-muted-foreground';
      case 'ordered': return 'bg-red-500 text-white'; // 대기 상태는 빨간색
      case 'cooking': return 'bg-warning text-warning-foreground';
      case 'ready': return 'bg-destructive text-destructive-foreground';
      case 'completed': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: TableData['status']) => {
    switch (status) {
      case 'empty': return '주문 없음';
      case 'ordered': return '대기'; // 대기 상태 텍스트
      case 'cooking': return '조리중';
      case 'ready': return '서빙대기';
      case 'completed': return '식사완료';
      default: return '주문 없음';
    }
  };

  const getStatusIcon = (status: TableData['status']) => {
    switch (status) {
      case 'ordered': return <Clock className="w-4 h-4" />;
      case 'cooking': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <CheckCircle2 className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  // Empty state
  if (tables.length === 0) {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="text-8xl">🪑</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">테이블이 아직 없어요</h2>
            <p className="text-muted-foreground text-lg">
              먼저 테이블 수를 설정하고 QR을 생성해보세요
            </p>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium px-8 py-4 rounded-xl text-lg shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            테이블 추가하기
          </Button>
        </div>

        {/* Add Table Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-2xl font-bold text-center">
                몇 개의 테이블을 추가할까요?
              </DialogTitle>
              <DialogDescription className="text-center text-lg">
                테이블 수를 선택하시면 QR 코드도 함께 생성됩니다
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">{tableCount[0]}</span>
                  <span className="text-lg text-muted-foreground ml-2">개</span>
                </div>
                
                <Slider
                  value={tableCount}
                  onValueChange={setTableCount}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1개</span>
                  <span>50개</span>
                </div>
              </div>
              
              <div className="text-center p-4 bg-primary-light rounded-lg">
                <p className="text-sm text-primary font-medium">
                  총 {tableCount[0]}개의 테이블이 추가됩니다
                </p>
              </div>
              
              <Button 
                onClick={handleAddTables}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-medium py-4 rounded-xl text-lg"
              >
                테이블 추가하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Tables grid view
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">주문 현황</h1>
            <p className="text-muted-foreground">총 {tables.length}개 테이블</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {isMobile ? "추가" : "테이블 추가"}
          </Button>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 px-4">
          {tables.map((table) => {
            const isPending = pendingOrders.has(table.id.toString());
            
            return (
              <Card
                key={table.id}
                id={`table-${table.id}`}
                onClick={() => handleTableClick(table)}
                className={`
                  relative aspect-square p-3 transition-all duration-200 border-2
                  ${table.status === 'empty' 
                    ? 'cursor-default opacity-60 border-dashed border-muted-foreground/30' 
                    : 'cursor-pointer hover:scale-105 hover:shadow-lg border-solid'
                  }
                  ${isPending 
                    ? 'bg-[#FFD700]/20 border-[#FFD700] animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.5)]' 
                    : ''
                  }
                `}
              >
              {/* NEW Badge for pending orders */}
              {isPending && (
                <Badge className="absolute top-1 right-1 text-xs px-2 py-1 bg-[#FFD700] text-black font-bold animate-bounce z-20">
                  🆕 NEW
                </Badge>
              )}

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteTable(table.id, e)}
                className={`absolute ${isPending ? 'top-8 right-1' : 'top-1 right-1'} h-6 w-6 p-0 hover:bg-destructive/10 z-10`}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>

              {/* Status Badge */}
              <Badge 
                className={`absolute top-1 left-1 text-xs px-2 py-1 ${getStatusColor(table.status)}`}
              >
                {getStatusIcon(table.status)}
                <span className="ml-1 hidden sm:inline">{getStatusText(table.status)}</span>
              </Badge>

              {/* Table Content */}
              <div className="h-full flex flex-col justify-center items-center space-y-2">
                <h3 className="text-lg font-bold text-foreground">{table.name}</h3>
                
                {table.status !== 'empty' && (
                  <>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">주문 수</p>
                      <p className="text-sm font-semibold text-primary">{table.orderCount}건</p>
                    </div>
                    {table.orderTime && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">주문 시간</p>
                        <p className="text-xs font-medium">{table.orderTime}</p>
                      </div>
                    )}
                  </>
                )}

                {table.status === 'empty' && (
                  <div className="flex flex-col items-center opacity-50">
                    <QrCode className="w-6 h-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground text-center">QR 준비됨</p>
                  </div>
                )}
              </div>
            </Card>
            );
          })}
          
          {/* Add Single Table Button */}
          <Card
            onClick={handleAddSingleTable}
            className="relative aspect-square p-3 transition-all duration-200 border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="h-full flex flex-col justify-center items-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground font-medium text-center">테이블 추가</p>
            </div>
          </Card>
        </div>

        {/* QR Info */}
        <div className="px-4 py-3 bg-primary/10 rounded-lg mx-4">
          <div className="flex items-center gap-2 text-sm text-primary">
            <QrCode className="w-4 h-4" />
            <span>QR 코드 변경이나 재발급은 [설정 &gt; QR 및 테이블 관리]에서 할 수 있어요.</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTableId !== null} onOpenChange={() => setDeleteTableId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTableId && tables.find(t => t.id === deleteTableId)?.name} 테이블을 삭제할까요?
            </AlertDialogTitle>
            <AlertDialogDescription>
              QR 코드도 함께 삭제되며, 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTableId(null)}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order End Confirmation Dialog */}
      <AlertDialog open={endOrderTableId !== null} onOpenChange={() => setEndOrderTableId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {endOrderTableId && tables.find(t => t.id === endOrderTableId)?.name} 테이블의 주문을 종료할까요?
            </AlertDialogTitle>
            <AlertDialogDescription>
              주문 데이터가 초기화되고 다음 손님이 새로 주문할 수 있습니다.
              <br />
              <span className="text-primary font-medium">⚠️ 이 작업은 취소할 수 없습니다.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEndOrderTableId(null)}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmOrderEnd}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              주문 종료
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Edit Sheet */}
      <OrderEditSheet
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        table={selectedTable}
        orders={selectedTable ? (tableOrders[selectedTable.id] || []) : []}
        onOrdersUpdate={handleOrdersUpdate}
        onOrderConfirm={handleOrderConfirm}
        onOrderEnd={handleOrderEnd}
        onOrderDelete={handleOrderDelete}
        firebaseOrders={firebaseOrders}
      />

      {/* Add Table Modal for existing tables */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-center">
              테이블 수 변경
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              <span className="text-destructive font-medium">⚠️ 기존 데이터가 삭제됩니다</span><br />
              새로운 테이블 수를 설정해주세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-primary">{tableCount[0]}</span>
                <span className="text-lg text-muted-foreground ml-2">개</span>
              </div>
              
              <Slider
                value={tableCount}
                onValueChange={setTableCount}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1개</span>
                <span>50개</span>
              </div>
            </div>
            
            <div className="text-center p-4 bg-warning-light rounded-lg">
              <p className="text-sm text-warning font-medium">
                총 {tableCount[0]}개로 테이블이 재설정됩니다
              </p>
            </div>
            
            <Button 
              onClick={handleAddTables}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-medium py-4 rounded-xl text-lg"
            >
              테이블 재설정하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 