import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { X, Plus, Minus, Search, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrderNotification } from "@/contexts/OrderNotificationContext";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface TableOrder {
  id: string;
  menuName: string;
  quantity: number;
  price: number;
  status: 'new' | 'cooking' | 'ready' | 'served';
  orderTime: string;
}

interface TableData {
  id: number;
  name: string;
  status: 'empty' | 'ordered' | 'cooking' | 'ready' | 'completed';
  orderCount: number;
  qrUrl: string;
  orderTime?: string;
}

interface MenuItemType {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  status?: {
    soldOut: boolean;
    ingredientsOut: boolean;
    salesStopped: boolean;
  };
}

interface OrderEditSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableData | null;
  orders: TableOrder[];
  onOrdersUpdate: (tableId: number, orders: TableOrder[]) => void;
  onOrderConfirm: () => void;
  onOrderEnd: (tableId: number) => void;
  onOrderDelete?: (orderId: string, menuName: string) => Promise<void>;
  firebaseOrders?: any[];
}

export function OrderEditSheet({ 
  isOpen, 
  onOpenChange, 
  table, 
  orders, 
  onOrdersUpdate, 
  onOrderConfirm, 
  onOrderEnd,
  onOrderDelete,
  firebaseOrders = []
}: OrderEditSheetProps) {
  const { toast } = useToast();
  const { pendingOrders } = useOrderNotification();
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [newOrderQuantities, setNewOrderQuantities] = useState<Record<string, number>>({});

  // Firebase 데이터 상태
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [loading, setLoading] = useState(false);

  // Firebase에서 메뉴 데이터 가져오기
  useEffect(() => {
    if (!isAddMenuOpen) return;

    setLoading(true);
    console.log('메뉴 데이터 로딩 시작...');
    
    const menuQuery = query(collection(db, "menus"), orderBy("name"));
    
    const unsubscribeMenu = onSnapshot(menuQuery, (snapshot) => {
      console.log('메뉴 스냅샷 받음:', snapshot.docs.length, '개 문서');
      
      const menuData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('메뉴 데이터:', doc.id, data);
        
        return {
          id: doc.id,
          name: data.name || '',
          price: data.price || 0,
          category: data.categoryName || '기타',
          description: data.description || '',
          image: data.image || '/placeholder.svg',
          status: data.status || { soldOut: false, ingredientsOut: false, salesStopped: false }
        } as MenuItemType;
      }).filter(item => {
        // 판매중지 메뉴 제외
        if (item.status && typeof item.status === 'object') {
          const status = item.status as any;
          return !status.salesStopped;
        }
        return true;
      });
      
      console.log('필터링된 메뉴:', menuData.length, '개');
      setMenuItems(menuData);
      
      // 카테고리 목록 업데이트
      const menuCategories = new Set<string>();
      menuData.forEach(item => {
        if (item.category) {
          menuCategories.add(item.category);
        }
      });
      
      const allCategories = ["전체", ...Array.from(menuCategories)];
      console.log('카테고리 목록:', allCategories);
      setCategories(allCategories);
      
      setLoading(false);
    }, (error) => {
      console.error('메뉴 데이터 로드 오류:', error);
      setLoading(false);
    });

    return () => unsubscribeMenu();
  }, [isAddMenuOpen]);

  if (!table) return null;

  const isPending = pendingOrders.has(table.id.toString());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-500 text-white'; // 대기 상태는 빨간색
      case 'preparing': return 'bg-warning text-warning-foreground'; // preparing 상태도 조리중 색상
      case 'cooking': return 'bg-warning text-warning-foreground';
      case 'ready': return 'bg-destructive text-destructive-foreground';
      case 'served': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return '대기'; // 대기 상태 텍스트
      case 'preparing': return '조리중'; // preparing 상태도 조리중 텍스트
      case 'cooking': return '조리중';
      case 'ready': return '서빙대기';
      case 'served': return '서빙완료';
      default: return '대기중';
    }
  };

  // 해당 테이블에 'new' 상태의 주문이 있는지 확인
  const hasNewOrders = () => {
    if (!table) return false;
    
    // Firebase 주문에서 해당 테이블의 'new' 상태 주문 확인 - tableNumber 비교 로직 개선
    const tableFirebaseOrders = firebaseOrders?.filter(order => {
      const orderTableNumber = parseInt(order.tableNumber);
      const tableId = table.id;
      
      console.log('hasNewOrders - 테이블 번호 비교:', {
        orderTableNumber: orderTableNumber,
        tableId: tableId,
        orderTableNumberString: order.tableNumber,
        tableIdString: table.id.toString(),
        isMatch: orderTableNumber === tableId,
        orderStatus: order.status
      });
      
      return orderTableNumber === tableId && order.status === 'new';
    }) || [];
    
    // 로컬 주문에서도 'new' 상태 주문 확인 (백업 체크)
    const tableLocalOrders = orders.filter(order => 
      order.status === 'new'
    ) || [];
    
    const hasNew = tableFirebaseOrders.length > 0 || tableLocalOrders.length > 0;
    
    console.log('hasNewOrders 체크:', {
      tableId: table.id,
      firebaseOrders: firebaseOrders,
      tableFirebaseOrders: tableFirebaseOrders,
      tableLocalOrders: tableLocalOrders,
      hasNew: hasNew,
      firebaseOrdersLength: firebaseOrders?.length || 0,
      ordersLength: orders.length
    });
    
    // Firebase 주문이나 로컬 주문 중 하나라도 'new' 상태가 있으면 true
    return hasNew;
  };

  // 주문의 실제 Firebase 상태를 가져오는 함수
  const getOrderFirebaseStatus = (orderId: string) => {
    const firebaseOrderId = orderId.split('-')[0];
    const firebaseOrder = firebaseOrders.find(order => order.id === firebaseOrderId);
    
    console.log('getOrderFirebaseStatus 디버깅:', {
      orderId: orderId,
      firebaseOrderId: firebaseOrderId,
      firebaseOrder: firebaseOrder,
      firebaseOrders: firebaseOrders,
      foundStatus: firebaseOrder?.status,
      tableNumber: firebaseOrder?.tableNumber,
      currentTableId: table?.id
    });
    
    // Firebase 주문 상태를 로컬 주문 상태로 매핑
    if (firebaseOrder) {
      switch (firebaseOrder.status) {
        case 'new': return 'new';
        case 'preparing': return 'cooking'; // preparing을 cooking으로 매핑
        case 'ready': return 'ready';
        case 'served': return 'served';
        default: return 'cooking';
      }
    }
    
    // Firebase 주문을 찾지 못한 경우 로컬 주문 상태 사용
    const localOrder = orders.find(order => order.id === orderId);
    return localOrder?.status || 'cooking';
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!table) return;
    
    const deletedOrder = orders.find(order => order.id === orderId);
    
    if (!deletedOrder) {
      toast({
        title: "삭제 실패",
        description: "삭제할 주문을 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Firebase 업데이트 콜백 호출만 수행
      if (onOrderDelete) {
        await onOrderDelete(orderId, deletedOrder.menuName);
      }
      
      setDeleteOrderId(null);
      
      toast({
        title: "메뉴 삭제 완료",
        description: `${deletedOrder.menuName}이(가) 주문에서 삭제되었습니다.`,
      });
    } catch (error) {
      console.error('메뉴 삭제 오류:', error);
      toast({
        title: "메뉴 삭제 실패",
        description: "메뉴 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleAddMenuItem = async (menuItem: MenuItemType) => {
    if (!table) return;
    
    const quantity = newOrderQuantities[menuItem.id] || 1;
    
    try {
      // Firebase에 새로운 주문 추가 - 손님용 페이지와 호환되는 구조
      const newFirebaseOrder = {
        tableNumber: table.id.toString(), // 문자열로 저장
        storeName: "오더랜드", // 손님용 페이지에서 필요
        items: [{
          name: menuItem.name,
          price: menuItem.price,
          quantity: quantity,
          image: menuItem.image,
          categoryName: menuItem.category
        }],
        totalAmount: menuItem.price * quantity,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
        orderNumber: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerInfo: {
          tableNumber: table.id.toString(),
          orderTime: new Date().toLocaleString('ko-KR'),
          totalItems: quantity
        },
        paymentStatus: 'pending',
        orderType: 'table'
      };
    
      const docRef = await addDoc(collection(db, 'orders'), newFirebaseOrder);
      
      console.log('새로운 주문 추가 완료:', {
        orderId: docRef.id,
        tableNumber: table.id,
        menuItem: menuItem.name,
        quantity: quantity
      });
      
      // Reset quantity for this item
      setNewOrderQuantities(prev => ({ ...prev, [menuItem.id]: 1 }));
    
      toast({
        title: "메뉴 추가 완료",
        description: `${menuItem.name} ${quantity}개가 추가되었습니다.`,
      });
    } catch (error) {
      console.error('Firebase 주문 추가 오류:', error);
      toast({
        title: "메뉴 추가 실패",
        description: "메뉴 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = (menuId: string, delta: number) => {
    setNewOrderQuantities(prev => {
      const current = prev[menuId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [menuId]: newValue };
    });
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "전체" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalAmount = orders.reduce((sum, order) => sum + (order.price * order.quantity), 0);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="space-y-4">
            <SheetTitle className="text-2xl font-bold">
              {table.name}
            </SheetTitle>
            <SheetDescription>
              테이블 주문 상세 정보
            </SheetDescription>
            
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">주문 수</p>
                <p className="text-xl font-bold text-primary">{orders.length}건</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">주문 시간</p>
                <p className="text-xl font-bold text-foreground">{table.orderTime}</p>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">주문 내역</h3>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">총 금액</p>
                <p className="text-xl font-bold text-primary">
                  {totalAmount.toLocaleString()}원
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="p-4 group relative animate-fade-in">
                  {/* Delete button - shows on hover */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteOrderId(order.id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 z-10"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 pr-8">
                      <h4 className="font-semibold">{order.menuName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.quantity}개 × {order.price.toLocaleString()}원
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {(order.price * order.quantity).toLocaleString()}원
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${getStatusColor(getOrderFirebaseStatus(order.id))}`}>
                      {getStatusText(getOrderFirebaseStatus(order.id))}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{order.orderTime}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Add Menu Button */}
            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                onClick={() => setIsAddMenuOpen(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                메뉴 추가하기
              </Button>
            </div>

            {/* Order Confirm Button for pending orders */}
            {hasNewOrders() && (
              <div className="pt-4 border-t border-border">
                <Button 
                  onClick={onOrderConfirm}
                  className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 text-lg shadow-lg"
                >
                  ✅ 주문 확인하기
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  주문을 확인하면 조리 상태로 변경됩니다
                </p>
              </div>
            )}

            {/* Order End Button for ready/completed orders */}
            {orders.length > 0 && (
              <div className="pt-4 border-t border-border">
                <Button 
                  onClick={() => onOrderEnd(table.id)}
                  className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-4 text-lg shadow-lg"
                >
                  <StopCircle className="w-5 h-5 mr-2" />
                  🛑 주문 종료
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  주문을 종료하면 테이블이 초기화되어 다음 손님이 이용할 수 있습니다
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Order Confirmation Dialog */}
      <AlertDialog open={deleteOrderId !== null} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              해당 메뉴를 삭제하시겠습니까?
              <br />
              <span className="text-primary font-medium">이 작업은 되돌릴 수 없습니다.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOrderId(null)}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteOrderId && handleDeleteOrder(deleteOrderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Menu Dialog */}
      <Sheet open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="space-y-4">
            <SheetTitle className="text-2xl font-bold">메뉴 추가하기</SheetTitle>
            <SheetDescription>
              {table.name}에 추가할 메뉴를 선택하세요
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="메뉴 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-5">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-muted-foreground">메뉴를 불러오는 중...</span>
                    </div>
                  ) : filteredMenuItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? '검색 결과가 없습니다.' : '등록된 메뉴가 없습니다.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMenuItems.map((menuItem) => (
                        <Card key={menuItem.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{menuItem.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {menuItem.price.toLocaleString()}원
                              </p>
                              {menuItem.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {menuItem.description}
                                </p>
                              )}
                              <Badge variant="secondary" className="text-xs mt-1">
                                {menuItem.category}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(menuItem.id, -1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {newOrderQuantities[menuItem.id] || 1}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(menuItem.id, 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Add Button */}
                              <Button
                                onClick={() => handleAddMenuItem(menuItem)}
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                추가하기
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default OrderEditSheet; 