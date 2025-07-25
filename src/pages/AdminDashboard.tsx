import { useState, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatisticsCards } from "@/components/admin/StatisticsCards";
import { OrdersSection } from "@/components/admin/OrdersSection";
import { ReservationsSection } from "@/components/admin/ReservationsSection";
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
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

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
      const reservationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(), // Firestore Timestamp를 Date로 변환
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Reservation[];
      setReservations(reservationsData);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeReservations();
    };
  }, [user]);

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