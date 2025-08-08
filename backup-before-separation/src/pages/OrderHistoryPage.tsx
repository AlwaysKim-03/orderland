import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  categoryName?: string;
}

interface Order {
  id: string;
  storeName: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  createdAt: any;
  orderNumber: string;
  customerInfo: {
    orderTime: string;
    totalItems: number;
  };
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

const OrderHistoryPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { storeName, tableNumber, storeId, tableId } = useParams<{ 
    storeName?: string; 
    tableNumber?: string;
    storeId?: string;
    tableId?: string;
  }>();
  
  // 손님용 페이지에서는 항상 라이트 모드 사용
  useEffect(() => {
    // 다크모드 클래스 제거하여 라이트 모드 강제 적용
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // URL 파라미터 디코딩
  const decodedStoreName = storeName ? decodeURIComponent(storeName) : 
                          storeId ? decodeURIComponent(storeId) : "오더랜드";
  const decodedTableNumber = tableNumber ? 
    decodeURIComponent(tableNumber).replace('table-', '') : 
    tableId ? decodeURIComponent(tableId) : "1";

  // Firebase에서 주문 내역 로드
  useEffect(() => {
    console.log('주문 내역 로딩 시작...');
    console.log('현재 테이블 번호:', decodedTableNumber);
    
    const ordersQuery = query(
      collection(db, "orders"),
      where("tableNumber", "==", decodedTableNumber),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      console.log('주문 내역 스냅샷 받음:', snapshot.docs.length, '개 문서');
      
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // storeName 필터링 제거 - tableNumber만으로 필터링
      // Firebase에서 이미 tableNumber로 필터링된 데이터를 받아오므로 추가 필터링 불필요
      console.log('Firebase에서 받은 주문 데이터:', ordersData);
      
      // 주문 상태 변경 감지 로그
      ordersData.forEach(order => {
        console.log(`주문 ${order.id} 상태:`, {
          status: order.status,
          tableNumber: order.tableNumber,
          items: order.items,
          totalAmount: order.totalAmount,
          orderNumber: order.orderNumber
        });
      });
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('주문 내역 로드 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [decodedTableNumber]);

  // 주문 종료 이벤트 감지하여 주문 내역 초기화
  useEffect(() => {
    const handleOrderEnded = (event: CustomEvent) => {
      const { tableId } = event.detail;
      console.log('OrderHistoryPage - 주문 종료 이벤트 감지:', tableId, '현재 테이블:', decodedTableNumber);
      
      // 현재 테이블의 주문이 종료된 경우에만 주문 내역 초기화
      if (tableId.toString() === decodedTableNumber) {
        console.log('OrderHistoryPage - 현재 테이블 주문 종료됨, 주문 내역 초기화');
        setOrders([]);
        
        toast({
          title: "주문이 종료되었습니다",
          description: "테이블이 초기화되어 새로운 주문을 시작할 수 있습니다.",
        });
      }
    };

    window.addEventListener('orderEnded', handleOrderEnded as EventListener);
    
    return () => {
      window.removeEventListener('orderEnded', handleOrderEnded as EventListener);
    };
  }, [decodedTableNumber, toast]);

  // 주문 상태 변경 알림 (별도 useEffect)
  useEffect(() => {
    if (orders.length > 0) {
      // 이전 주문 상태와 비교하여 변경된 주문 알림
      // 이 로직은 실제로는 Firebase 리스너에서 자동으로 처리되므로 제거
    }
  }, [orders]);

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'new': return '신규 주문';
      case 'preparing': return '조리 중';
      case 'ready': return '준비 완료';
      case 'served': return '서빙 완료';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'served': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-orange-100 text-orange-700';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'served': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '시간 정보 없음';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '시간 정보 없음';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF914D] mx-auto"></div>
          <p className="mt-4 text-gray-600">주문 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F5] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/order/${storeName}/${tableNumber}`)}
            className="p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">주문 내역</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">주문 내역이 없습니다</h3>
            <p className="text-gray-500 mb-6">아직 주문한 메뉴가 없습니다</p>
            <Button
              onClick={() => navigate(`/order/${storeName}/${tableNumber}`)}
              className="bg-[#FF914D] hover:bg-[#e8823d] text-white"
            >
              메뉴 보기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        주문 #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusText(order.status)}</span>
                    </Badge>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.image || '/placeholder.svg'}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity}개 × {item.price.toLocaleString()}원
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {(item.price * item.quantity).toLocaleString()}원
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">총 {order.customerInfo?.totalItems || order.items.length}개 메뉴</p>
                      <p className="text-sm text-gray-600">
                        결제 상태: {order.paymentStatus === 'paid' ? '결제 완료' : '대기 중'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#FF914D]">
                        ₩{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage; 