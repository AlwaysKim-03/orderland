import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, QrCode, Clock, ChefHat, CheckCircle2, Trash2, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { playCookingCompleteSound } from "@/utils/soundNotification";

interface TableData {
  id: number;
  name: string;
  status: 'empty' | 'ordered' | 'cooking' | 'ready';
  orderCount: number;
  qrUrl: string;
  orderTime?: string;
  totalAmount?: number;
}

interface TableOrder {
  id: string;
  menuName: string;
  quantity: number;
  price: number;
  status: 'cooking' | 'ready' | 'served';
  orderTime: string;
}

interface FirebaseOrder {
  id: string;
  tableNumber: string;
  storeName: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    image?: string;
    categoryName?: string;
  }>;
  totalAmount: number;
  status: string;
  createdAt: any;
  updatedAt: any;
  storeId: string;
  orderNumber: string;
  customerInfo: {
    tableNumber: string;
    orderTime: string;
    totalItems: number;
  };
  paymentStatus: string;
  orderType: string;
}

export function TableManagement() {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("store");
  const [tables, setTables] = useState<TableData[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tableCount, setTableCount] = useState([10]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteTableId, setDeleteTableId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [firebaseOrders, setFirebaseOrders] = useState<FirebaseOrder[]>([]);

  // Load tables from localStorage on component mount
  const loadTablesFromStorage = () => {
    try {
      const stored = localStorage.getItem('orderland-tables');
      if (stored) {
        const tables = JSON.parse(stored);
        console.log('로드된 테이블 데이터:', tables);
        // QR URL이 올바른 형식인지 확인하고 수정
        return tables.map((table: TableData) => ({
          ...table,
          qrUrl: table.qrUrl.includes('/qr/') 
            ? `${window.location.origin}/order/${storeName || 'store'}/table-${table.id}`
            : table.qrUrl
        }));
      }
    } catch (error) {
      console.error('Error loading tables from storage:', error);
    }
    return [];
  };

  // 컴포넌트 마운트 시 localStorage에서 테이블 데이터 로드
  useEffect(() => {
    const loadedTables = loadTablesFromStorage();
    if (loadedTables.length > 0) {
      setTables(loadedTables);
      setIsInitialized(true);
    } else {
      // 데이터가 없으면 빈 상태로 유지
      setTables([]);
      setIsInitialized(true);
    }
  }, []);

  // 매장명 가져오기
  useEffect(() => {
    const fetchStoreName = async () => {
      try {
        const storeDoc = await getDoc(doc(db, "settings", "store"));
        if (storeDoc.exists()) {
          const data = storeDoc.data();
          const newStoreName = data.storeName || "store";
          setStoreName(newStoreName);
          
          // 기존 테이블이 있으면 QR URL 업데이트
          if (tables.length > 0) {
            updateTableQRUrls(newStoreName);
          }
        }
      } catch (error) {
        console.error('매장명 가져오기 실패:', error);
      }
    };

    fetchStoreName();
  }, []);

  // Firebase에서 주문 데이터 실시간 로드
  useEffect(() => {
    if (!isInitialized) return; // 테이블이 초기화되지 않았으면 실행하지 않음
    
    console.log('Firebase 주문 데이터 로딩 시작...');
    
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      console.log('주문 스냅샷 받음:', snapshot.docs.length, '개 문서');
      
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseOrder[];
      
      console.log('로드된 Firebase 주문:', ordersData);
      setFirebaseOrders(ordersData);
      
      // 테이블 상태 업데이트
      updateTableStatusFromOrders(ordersData);
    }, (error) => {
      console.error('Firebase 주문 데이터 로드 오류:', error);
    });

    return () => unsubscribe();
  }, [isInitialized]); // tables 대신 isInitialized를 의존성으로 사용

  // 주문 데이터로 테이블 상태 업데이트
  const updateTableStatusFromOrders = (orders: FirebaseOrder[]) => {
    if (tables.length === 0) return;

    console.log('테이블 상태 업데이트 시작, 테이블 수:', tables.length);
    console.log('주문 데이터:', orders);

    const updatedTables = tables.map(table => {
      // tableNumber를 문자열로 비교 (Firebase에서는 문자열로 저장됨)
      const tableOrders = orders.filter(order => 
        order.tableNumber === table.id.toString() && 
        order.status !== 'completed' && 
        order.status !== 'cancelled'
      );

      console.log(`테이블 ${table.id}의 주문:`, tableOrders);

      if (tableOrders.length === 0) {
        return { ...table, status: 'empty' as const, orderCount: 0, totalAmount: 0 };
      }

      const latestOrder = tableOrders[0];
      const totalAmount = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // 주문 상태 매핑 수정
      let status: 'ordered' | 'cooking' | 'ready' = 'ordered';
      if (latestOrder.status === 'preparing' || latestOrder.status === 'cooking') status = 'cooking';
      else if (latestOrder.status === 'ready' || latestOrder.status === 'completed') status = 'ready';

      const updatedTable = {
        ...table,
        status,
        orderCount: tableOrders.length,
        orderTime: latestOrder.customerInfo?.orderTime || new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        totalAmount
      };

      console.log(`테이블 ${table.id} 업데이트:`, updatedTable);
      return updatedTable;
    });

    // 실제로 변경된 테이블이 있는지 확인
    const hasChanges = updatedTables.some((updatedTable, index) => {
      const currentTable = tables[index];
      return (
        updatedTable.status !== currentTable.status ||
        updatedTable.orderCount !== currentTable.orderCount ||
        updatedTable.totalAmount !== currentTable.totalAmount
      );
    });

    if (hasChanges) {
      console.log('테이블 상태 변경 감지, 업데이트 실행');
      
      // 조리완료 알림 사운드 재생 (새로 'ready' 상태가 된 테이블이 있는지 확인)
      const newlyReadyTables = updatedTables.filter((updatedTable, index) => {
        const currentTable = tables[index];
        return updatedTable.status === 'ready' && currentTable.status !== 'ready';
      });
      
      if (newlyReadyTables.length > 0) {
        console.log('조리완료된 테이블 감지:', newlyReadyTables.map(t => t.name));
        playCookingCompleteSound().catch(error => {
          console.error('조리완료 알림 사운드 재생 실패:', error);
        });
      }
      
      setTables(updatedTables);
      saveTablestoStorage(updatedTables);
    }
  };

  const updateTableQRUrls = (newStoreName: string) => {
    const updatedTables = tables.map(table => ({
      ...table,
      qrUrl: `${window.location.origin}/order/${newStoreName}/table-${table.id}`
    }));
    setTables(updatedTables);
    saveTablestoStorage(updatedTables);
  };

  const getTableCount = () => {
    return tables.length;
  };

  const getTables = () => {
    return tables;
  };

  const saveTablestoStorage = (newTables: TableData[]) => {
    try {
      localStorage.setItem('orderland-tables', JSON.stringify(newTables));
    } catch (error) {
      console.error('Error saving tables to storage:', error);
    }
  };

  const generateTables = (count: number) => {
    const newTables: TableData[] = [];
    for (let i = 1; i <= count; i++) {
      newTables.push({
        id: i,
        name: `${i}번 테이블`,
        status: 'empty',
        orderCount: 0,
        qrUrl: `${window.location.origin}/order/${storeName}/table-${i}`,
        totalAmount: 0
      });
    }
    return newTables;
  };

  const getNextTableNumber = () => {
    return Math.max(...tables.map(t => t.id), 0) + 1;
  };

  const handleAddSingleTable = () => {
    const nextId = getNextTableNumber();
    const newTable: TableData = {
      id: nextId,
      name: `${nextId}번 테이블`,
      status: 'empty',
      orderCount: 0,
      qrUrl: `${window.location.origin}/order/${storeName}/table-${nextId}`,
      totalAmount: 0
    };
    
    const updatedTables = [...tables, newTable];
    setTables(updatedTables);
    saveTablestoStorage(updatedTables);
    
    toast({
      title: "테이블 추가 완료",
      description: `${nextId}번 테이블이 추가되었습니다.`,
    });
  };

  const handleDeleteTable = (tableId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTableId(tableId);
  };

  const confirmDeleteTable = () => {
    if (deleteTableId === null) return;
    
    const updatedTables = tables.filter(table => table.id !== deleteTableId);
    setTables(updatedTables);
    saveTablestoStorage(updatedTables);
    setDeleteTableId(null);
    
    toast({
      title: "테이블 삭제 완료",
      description: "테이블이 삭제되었습니다.",
    });
  };

  const handleAddTables = () => {
    const newTables = generateTables(tableCount[0]);
    setTables(newTables);
    saveTablestoStorage(newTables);
    setIsAddModalOpen(false);
    
    toast({
      title: "테이블 생성 완료",
      description: `${tableCount[0]}개의 테이블이 생성되었습니다.`,
    });
  };

  const handleTableClick = (table: TableData) => {
    // 임시로 빈 테이블도 클릭 가능하도록 수정
    // if (table.status === 'empty') return;
    setSelectedTable(table);
    setIsDetailOpen(true);
  };

  const getStatusColor = (status: TableData['status']) => {
    switch (status) {
      case 'empty': return 'bg-muted text-muted-foreground';
      case 'ordered': return 'bg-primary text-primary-foreground';
      case 'cooking': return 'bg-warning text-warning-foreground';
      case 'ready': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: TableData['status']) => {
    switch (status) {
      case 'empty': return '주문 없음';
      case 'ordered': return '주문중';
      case 'cooking': return '조리중';
      case 'ready': return '서빙대기';
      default: return '주문 없음';
    }
  };

  const getStatusIcon = (status: TableData['status']) => {
    switch (status) {
      case 'ordered': return <Clock className="w-4 h-4" />;
      case 'cooking': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <CheckCircle2 className="w-4 h-4" />;
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-4 rounded-xl text-lg shadow-lg"
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
              
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  총 {tableCount[0]}개의 테이블이 추가됩니다
                </p>
              </div>
              
              <Button 
                onClick={handleAddTables}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 rounded-xl text-lg"
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
            테이블 추가
          </Button>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 px-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`
                relative aspect-square p-3 transition-all duration-200 border-2
                ${table.status === 'empty' 
                  ? 'cursor-default opacity-60 border-dashed border-muted-foreground/30' 
                  : 'cursor-pointer hover:scale-105 hover:shadow-lg border-solid'
                }
              `}
            >
              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteTable(table.id, e)}
                className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-destructive/10 z-10"
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
                
                {table.status !== 'empty' ? (
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
                ) : (
                  <div className="flex flex-col items-center opacity-50">
                    <QrCode className="w-6 h-6 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground text-center">QR 준비됨</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
          
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

      {/* Order Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="space-y-4">
            <SheetTitle className="text-2xl font-bold">
              {selectedTable?.name}
            </SheetTitle>
            <SheetDescription>
              테이블 주문 상세 정보
            </SheetDescription>
            
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">주문 수</p>
                <p className="text-xl font-bold text-primary">{selectedTable?.orderCount}건</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">주문 시간</p>
                <p className="text-xl font-bold text-foreground">{selectedTable?.orderTime}</p>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">주문 내역</h3>
            
            {selectedTable && selectedTable.status === 'empty' ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🍽️</div>
                <p className="text-muted-foreground">아직 주문이 없습니다</p>
                <p className="text-sm text-muted-foreground mt-2">
                  고객이 QR 코드를 스캔하여 주문하면 여기에 표시됩니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTable && firebaseOrders
                  .filter(order => order.tableNumber === selectedTable.id.toString())
                  .map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold">주문 #{order.id.slice(-6)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length}개 메뉴
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {order.totalAmount.toLocaleString()}원
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>{(item.price * item.quantity).toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <Badge className={`text-xs ${getStatusColor(order.status as any)}`}>
                          {order.status === 'new' ? '신규 주문' : 
                           order.status === 'preparing' ? '조리 중' : 
                           order.status === 'ready' ? '준비 완료' : order.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {order.customerInfo?.orderTime || '시간 정보 없음'}
                        </p>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
            
            <div className="text-center p-4 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-700 font-medium">
                총 {tableCount[0]}개로 테이블이 재설정됩니다
              </p>
            </div>
            
            <Button 
              onClick={handleAddTables}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 rounded-xl text-lg"
            >
              테이블 재설정하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 