import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";

interface OrderNotification {
  id: string;
  tableNumber: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type?: 'order' | 'call';
}

interface OrderNotificationContextType {
  notifications: OrderNotification[];
  unreadCount: number;
  addNotification: (tableNumber: string, message: string, type?: 'order' | 'call') => void;
  markAsRead: (notificationId: string) => void;
  clearNotification: (notificationId: string) => void;
  pendingOrders: Set<string>;
  addPendingOrder: (tableId: string) => void;
  removePendingOrder: (tableId: string) => void;
  staffCalls: Set<string>;
  addStaffCall: (tableId: string) => void;
  removeStaffCall: (tableId: string) => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export function OrderNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Set<string>>(new Set());
  const [staffCalls, setStaffCalls] = useState<Set<string>>(new Set());

  const addNotification = (tableNumber: string, message: string, type: 'order' | 'call' = 'order') => {
    const newNotification: OrderNotification = {
      id: Date.now().toString(),
      tableNumber,
      message,
      timestamp: new Date(),
      isRead: false,
      type
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const addPendingOrder = (tableId: string) => {
    console.log('addPendingOrder 호출됨:', tableId);
    console.log('현재 pendingOrders (추가 전):', Array.from(pendingOrders));
    
    setPendingOrders(prev => {
      const newSet = new Set([...prev, tableId]);
      console.log('새로운 pendingOrders:', Array.from(newSet));
      return newSet;
    });
  };

  const removePendingOrder = (tableId: string) => {
    console.log('removePendingOrder 호출됨:', tableId);
    setPendingOrders(prev => {
      const newSet = new Set(prev);
      newSet.delete(tableId);
      console.log('제거 후 pendingOrders:', Array.from(newSet));
      return newSet;
    });
  };

  const addStaffCall = (tableId: string) => {
    setStaffCalls(prev => new Set([...prev, tableId]));
    
    // 30초 후 자동으로 제거
    setTimeout(() => {
      removeStaffCall(tableId);
    }, 30000);
  };

  const removeStaffCall = (tableId: string) => {
    setStaffCalls(prev => {
      const newSet = new Set(prev);
      newSet.delete(tableId);
      return newSet;
    });
  };

  // Firebase 실시간 신규 주문 감지
  useEffect(() => {
    console.log('실시간 신규 주문 감지 시작...');
    
    let unsubscribe: (() => void) | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    const setupListener = () => {
      try {
        // 신규 주문만 감지하는 쿼리
        const newOrdersQuery = query(
          collection(db, 'orders'),
          where('status', '==', 'new'),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(newOrdersQuery, (snapshot) => {
          console.log('신규 주문 스냅샷 받음:', snapshot.docs.length, '개 문서');
          retryCount = 0;
          
          // 변경사항이 있는 문서만 처리
          snapshot.docChanges().forEach((change) => {
            console.log('문서 변경 감지:', change.type, change.doc.id);
            
            if (change.type === 'added') {
              const orderData = change.doc.data();
              const tableNumber = orderData.tableNumber;
              
              console.log('새로운 주문 감지:', change.doc.id, '테이블:', tableNumber);
              
              // tableNumber를 숫자로 변환하여 저장
              const tableIdAsNumber = parseInt(tableNumber);
              if (!isNaN(tableIdAsNumber)) {
                // 신규주문 효과 적용
                addPendingOrder(tableIdAsNumber.toString());
                
                // 알림 추가
                addNotification(
                  tableNumber,
                  `테이블 ${tableNumber}에서 새로운 주문이 들어왔습니다.`,
                  'order'
                );
                
                console.log('신규 주문 효과 적용 완료:', tableNumber);
              } else {
                console.log('유효하지 않은 테이블 번호:', tableNumber);
              }
            }
          });
        }, (error) => {
          console.error('Firebase 실시간 주문 감지 오류:', error);
          
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
            console.error('최대 재시도 횟수 초과. 실시간 감지를 중단합니다.');
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
  }, []); // 의존성 배열을 비워서 무한 루프 방지

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <OrderNotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      clearNotification,
      pendingOrders,
      addPendingOrder,
      removePendingOrder,
      staffCalls,
      addStaffCall,
      removeStaffCall
    }}>
      {children}
    </OrderNotificationContext.Provider>
  );
}

export function useOrderNotification() {
  const context = useContext(OrderNotificationContext);
  if (context === undefined) {
    throw new Error('useOrderNotification must be used within an OrderNotificationProvider');
  }
  return context;
} 