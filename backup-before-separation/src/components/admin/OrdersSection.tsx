import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Eye } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  orders?: OrderItem[] | string;
  totalPrice: number;
  status: string;
  tableNumber?: string;
  table?: string;
  createdAt: any;
  timeString: string;
}

interface OrdersSectionProps {
  orders?: Order[];
  onOrderUpdate?: () => void;
}

export function OrdersSection({ orders = [], onOrderUpdate }: OrdersSectionProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableCount, setTableCount] = useState(0);

  // 테이블 수 초기화 및 변경 감지
  useEffect(() => {
    const updateTableCount = () => {
      try {
        const stored = localStorage.getItem('orderland-tables');
        if (stored) {
          const tables = JSON.parse(stored);
          setTableCount(tables.length);
        } else {
          setTableCount(0);
        }
      } catch (error) {
        console.error('테이블 수 로드 오류:', error);
        setTableCount(0);
      }
    };

    // 초기 테이블 수 로드
    updateTableCount();

    // 테이블 수 변경 이벤트 리스너
    const handleTableCountChange = (event: CustomEvent) => {
      console.log('테이블 수 변경 감지:', event.detail.tableCount);
      setTableCount(event.detail.tableCount);
    };

    window.addEventListener('tableCountChanged', handleTableCountChange as EventListener);

    // localStorage 변경 감지
    const handleStorageChange = () => {
      updateTableCount();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('tableCountChanged', handleTableCountChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 주문 데이터 변환
  const transformedOrders = useMemo(() => {
    console.log('OrdersSection - 원본 주문 데이터:', orders);
    
    return orders.map(order => {
      console.log('OrdersSection - 개별 주문 처리:', order);
      
      let items: OrderItem[] = [];
      if (order.items && Array.isArray(order.items)) {
        items = order.items;
        console.log('OrdersSection - items 배열 사용:', items);
      } else if (order.orders && Array.isArray(order.orders)) {
        items = order.orders;
        console.log('OrdersSection - orders 배열 사용:', items);
      } else if (typeof order.orders === 'string') {
        try {
          items = JSON.parse(order.orders);
          console.log('OrdersSection - orders 문자열 파싱:', items);
        } catch (e) {
          console.error('주문 데이터 파싱 실패:', e);
        }
      }

      const totalPrice = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      const orderTime = order.createdAt?.toDate?.() || new Date(order.createdAt);
      
      const transformedOrder = {
        id: order.id,
        items: items,
        totalPrice: totalPrice,
        status: order.status || 'waiting',
        tableNumber: order.tableNumber || order.table || 'N/A',
        createdAt: orderTime,
        timeString: orderTime.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      };
      
      console.log('OrdersSection - 변환된 주문:', transformedOrder);
      return transformedOrder;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders]);

  console.log('OrdersSection - 최종 변환된 주문 목록:', transformedOrders);

  const handleServeOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'served',
        servedAt: new Date()
      });
      
      if (onOrderUpdate) {
        onOrderUpdate();
      }
    } catch (error) {
      console.error('주문 상태 업데이트 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // 오늘 주문된 인기 메뉴 계산
  const todayOrdersSummary = useMemo(() => {
    const menuCounts: { [key: string]: { count: number; price: number } } = {};
    
    transformedOrders.forEach(order => {
      order.items.forEach(item => {
        if (menuCounts[item.name]) {
          menuCounts[item.name].count += item.quantity;
        } else {
          menuCounts[item.name] = { count: item.quantity, price: item.price };
        }
      });
    });

    return Object.entries(menuCounts)
      .map(([name, data]) => ({
        name,
        price: `₩${data.price.toLocaleString()}`,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [transformedOrders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge className="bg-warning/10 text-warning border-warning">대기</Badge>;
      case "cooking":
        return <Badge className="bg-primary/10 text-primary border-primary">조리중</Badge>;
      case "completed":
        return <Badge className="bg-success/10 text-success border-success">완료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Orders Table */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              실시간 주문 현황
              <Badge variant="outline" className="ml-2">
                테이블 {tableCount}개
              </Badge>
            </CardTitle>
            <CardDescription>
              들어온 주문을 실시간으로 확인하고 관리하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문번호</TableHead>
                  <TableHead>메뉴명</TableHead>
                  <TableHead>수량</TableHead>
                  <TableHead>가격</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformedOrders.map((order, index) => {
                  console.log(`테이블 렌더링 - 주문 ${index}:`, order);
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        테이블 {order.tableNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.items[0]?.name || '메뉴명 없음'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.items[0]?.quantity || 1}개</TableCell>
                      <TableCell className="font-semibold text-orange-600">₩{order.totalPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{order.timeString}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openOrderDetail(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          상세
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Today Orders Summary */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today Orders</CardTitle>
            <CardDescription>오늘 주문된 인기 메뉴</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayOrdersSummary.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.count}번 주문</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary text-sm">{item.price}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}