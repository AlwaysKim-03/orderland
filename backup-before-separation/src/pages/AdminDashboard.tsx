import { useState, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatisticsCards } from "@/components/admin/StatisticsCards";
import { OrdersSection } from "@/components/admin/OrdersSection";
import { ReservationsSection } from "@/components/admin/ReservationsSection";
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: Date;
  time: string;
  partySize: number;
  specialRequests: string[];
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

interface StaffCall {
  id: string;
  tableNumber: string;
  storeName: string;
  services: string[];
  customRequest: string;
  status: 'pending' | 'confirmed';
  createdAt: any;
  storeId: string;
}

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Firebase Auth 상태 감지
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // 주문 데이터 실시간 구독 (모든 주문 표시)
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      console.log('=== 관리자 페이지 - 주문 데이터 수신 ===');
      console.log('스냅샷 크기:', snapshot.size);
      console.log('스냅샷 빈 상태:', snapshot.empty);
      
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`주문 문서 ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log('=== 최종 주문 데이터 ===');
      console.log('주문 수:', ordersData.length);
      console.log('주문 목록:', ordersData);
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('주문 데이터 로드 오류:', error);
      setLoading(false);
    });

    // 예약 데이터 실시간 구독
    const reservationsQuery = query(
      collection(db, 'reservations'),
      orderBy('date', 'desc')
    );

    const unsubscribeReservations = onSnapshot(reservationsQuery, (snapshot) => {
      const reservationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // date 필드 안전한 변환
        let date: Date;
        try {
          if (data.date && typeof data.date.toDate === 'function') {
            date = data.date.toDate();
          } else if (data.date instanceof Date) {
            date = data.date;
          } else if (data.date) {
            date = new Date(data.date);
          } else {
            date = new Date();
          }
        } catch (error) {
          console.warn('날짜 변환 오류:', error, '문서 ID:', doc.id);
          date = new Date();
        }
        
        // createdAt 필드 안전한 변환
        let createdAt: Date;
        try {
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          } else if (data.createdAt) {
            createdAt = new Date(data.createdAt);
          } else {
            createdAt = new Date();
          }
        } catch (error) {
          console.warn('createdAt 변환 오류:', error, '문서 ID:', doc.id);
          createdAt = new Date();
        }
        
        // updatedAt 필드 안전한 변환
        let updatedAt: Date;
        try {
          if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            updatedAt = data.updatedAt.toDate();
          } else if (data.updatedAt instanceof Date) {
            updatedAt = data.updatedAt;
          } else if (data.updatedAt) {
            updatedAt = new Date(data.updatedAt);
          } else {
            updatedAt = new Date();
          }
        } catch (error) {
          console.warn('updatedAt 변환 오류:', error, '문서 ID:', doc.id);
          updatedAt = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          date,
          createdAt,
          updatedAt
        };
      }) as Reservation[];
      
      setReservations(reservationsData);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeReservations();
    };
  }, [user]);

  // 직원 호출 데이터 실시간 구독
  useEffect(() => {
    if (!user) return;

    const staffCallsQuery = query(
      collection(db, 'staff-calls'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeStaffCalls = onSnapshot(staffCallsQuery, (snapshot) => {
      console.log('=== 관리자 페이지 - 직원 호출 데이터 수신 ===');
      console.log('스냅샷 크기:', snapshot.size);
      
      const staffCallsData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`직원 호출 문서 ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data
        };
      }) as StaffCall[];
      
      console.log('=== 최종 직원 호출 데이터 ===');
      console.log('호출 수:', staffCallsData.length);
      console.log('호출 목록:', staffCallsData);
      
      setStaffCalls(staffCallsData);
    }, (error) => {
      console.error('직원 호출 데이터 로드 오류:', error);
    });

    return () => {
      unsubscribeStaffCalls();
    };
  }, [user]);

  // 직원 호출 확인 처리
  const handleStaffCallConfirm = async (callId: string) => {
    try {
      await updateDoc(doc(db, 'staff-calls', callId), {
        status: 'confirmed',
        confirmedAt: new Date()
      });
    } catch (error) {
      console.error('직원 호출 확인 실패:', error);
    }
  };

  const handleOrderUpdate = () => {
    // 주문 업데이트 시 호출되는 콜백
    console.log('주문이 업데이트되었습니다.');
  };

  const handleReservationUpdate = () => {
    // 예약 업데이트 시 호출되는 콜백
    console.log('예약이 업데이트되었습니다.');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          
          <main className="flex-1 p-6 space-y-8">
            {/* Statistics Cards */}
            <StatisticsCards orders={orders} reservations={reservations} />
            
            {/* Orders Section */}
            <OrdersSection 
              orders={orders} 
              onOrderUpdate={handleOrderUpdate} 
            />
            
            {/* Reservations Section */}
            <ReservationsSection 
              reservations={reservations} 
              onReservationUpdate={handleReservationUpdate}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;