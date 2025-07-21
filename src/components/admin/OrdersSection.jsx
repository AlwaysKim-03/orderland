import React, { useState, useMemo } from 'react';
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
import { Clock, Eye, CheckCircle, XCircle, ChefHat, Truck } from "lucide-react";
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const getStatusBadge = (status) => {
  switch (status) {
    case "waiting":
    case "new":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2 py-1">대기</Badge>;
    case "cooking":
    case "processing":
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs px-2 py-1">조리중</Badge>;
    case "completed":
    case "served":
      return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">완료</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs px-2 py-1">대기</Badge>;
  }
};

export default function OrdersSection({ orders = [], onOrderUpdate }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 주문 데이터 변환
  const transformedOrders = useMemo(() => {
    return orders.map(order => {
      let items = [];
      if (order.items && Array.isArray(order.items)) {
        items = order.items;
      } else if (order.orders && Array.isArray(order.orders)) {
        items = order.orders;
      } else if (typeof order.orders === 'string') {
        try {
          items = JSON.parse(order.orders);
        } catch (e) {
          console.error('주문 데이터 파싱 실패:', e);
        }
      }

      const totalPrice = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      const orderTime = order.createdAt?.toDate?.() || new Date(order.createdAt);
      
      return {
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
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders]);

  const handleServeOrder = async (orderId) => {
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

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">실시간 주문 현황</h2>
          <p className="text-sm text-gray-600 mt-1">
            들어온 주문을 실시간으로 확인하고 관리하세요
          </p>
        </div>
      </div>

      {/* 주문 테이블 */}
      {transformedOrders.length === 0 ? (
        <Card className="bg-white border border-gray-200 rounded-lg">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🍽️</div>
            <div className="text-lg font-medium text-gray-900 mb-2">주문이 없습니다</div>
            <div className="text-sm text-gray-600">
              아직 들어온 주문이 없습니다. 새로운 주문을 기다리고 있습니다.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transformedOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow duration-200">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                {/* 주문번호 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">주문번호</p>
                  <p className="text-sm text-gray-600">{order.id.slice(-6)}</p>
                </div>
                
                {/* 메뉴명 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">메뉴명</p>
                  <div>
                    <p className="text-sm text-gray-900">{order.items[0]?.name || '메뉴명 없음'}</p>
                    <p className="text-xs text-gray-500">테이블 {order.tableNumber}</p>
                  </div>
                </div>
                
                {/* 수량 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">수량</p>
                  <p className="text-sm text-gray-600">{order.items[0]?.quantity || 1}개</p>
                </div>
                
                {/* 가격 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">가격</p>
                  <p className="text-sm font-semibold text-orange-600">₩{order.totalPrice.toLocaleString()}</p>
                </div>
                
                {/* 시간 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">시간</p>
                  <p className="text-sm text-gray-600">{order.timeString}</p>
                </div>
                
                {/* 상태 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">상태</p>
                  <div>{getStatusBadge(order.status)}</div>
                </div>
                
                {/* 액션 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">액션</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openOrderDetail(order)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-3 py-1 h-8"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    상세
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 주문 상세 모달 */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">주문 상세</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">주문번호</p>
                <p className="font-medium">{selectedOrder.id.slice(-6)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">테이블</p>
                <p className="font-medium">테이블 {selectedOrder.tableNumber}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">주문 메뉴</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="text-gray-600">{item.quantity}개</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-medium">총 금액</span>
                  <span className="font-bold text-orange-600">₩{selectedOrder.totalPrice.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleServeOrder(selectedOrder.id);
                    setIsModalOpen(false);
                  }}
                  disabled={loading}
                >
                  {loading ? '처리중...' : '서빙 완료'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 