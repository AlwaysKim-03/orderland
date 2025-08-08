import { useState } from "react";
import { MobileHeader } from "@/components/ui/mobile-header";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Users, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  requests?: string;
  status: "confirmed" | "arrived" | "completed" | "cancelled";
  reminderSent?: boolean;
}

const mockReservations: Reservation[] = [
  {
    id: "1",
    name: "김영희",
    phone: "010-1234-5678",
    date: "2024-01-20",
    time: "18:30",
    guests: 4,
    requests: "창가 자리 희망",
    status: "confirmed",
    reminderSent: true
  },
  {
    id: "2",
    name: "박민수",
    phone: "010-9876-5432", 
    date: "2024-01-20",
    time: "19:00",
    guests: 2,
    status: "arrived"
  }
];

export default function Reservations() {
  const [reservations, setReservations] = useState(mockReservations);

  const getStatusBadge = (status: Reservation["status"]) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-primary text-primary-foreground">예약확정</Badge>;
      case "arrived":
        return <Badge className="bg-success text-success-foreground">도착완료</Badge>;
      case "completed":
        return <Badge variant="secondary">식사완료</Badge>;
      case "cancelled":
        return <Badge variant="destructive">취소</Badge>;
    }
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  // Empty state when no reservations
  if (reservations.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <MobileHeader
          title="예약 관리"
          rightIcon={Plus}
          onRightClick={() => {}}
        />
        
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="text-8xl mb-6">📅</div>
          <h2 className="mobile-title mb-3">예약이 없습니다</h2>
          <p className="mobile-body text-muted-foreground text-center mb-8 max-w-sm">
            첫 번째 예약을 받고 체계적으로 매장을 운영해보세요
          </p>
          
          <Button className="w-full max-w-sm" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            예약 추가하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="예약 관리"
        subtitle={`오늘 ${reservations.length}건`}
        rightIcon={Plus}
        onRightClick={() => {}}
      />

      {/* Today's Summary */}
      <div className="px-4 py-3">
        <div className="bg-gradient-primary rounded-xl p-4 text-primary-foreground">
          <h3 className="mobile-subtitle mb-2">오늘의 예약 현황</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">
                {reservations.filter(r => r.status === "confirmed").length}
              </div>
              <div className="text-sm opacity-90">예약확정</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {reservations.filter(r => r.status === "arrived").length}
              </div>
              <div className="text-sm opacity-90">도착완료</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {reservations.reduce((sum, r) => sum + r.guests, 0)}
              </div>
              <div className="text-sm opacity-90">총 인원</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="px-4 space-y-3">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">
                    {reservation.name[0]}
                  </span>
                </div>
                <div>
                  <h3 className="mobile-subtitle">{reservation.name}</h3>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{formatPhoneNumber(reservation.phone)}</span>
                  </div>
                </div>
              </div>
              {getStatusBadge(reservation.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{reservation.time}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{reservation.guests}명</span>
              </div>
            </div>

            {reservation.requests && (
              <div className="flex items-start space-x-2 text-sm mb-3">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{reservation.requests}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {reservation.reminderSent && (
                  <Badge variant="outline" className="text-xs">
                    📱 리마인드 발송완료
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-2">
                {reservation.status === "confirmed" && (
                  <Button variant="outline" size="sm">
                    도착확인
                  </Button>
                )}
                {reservation.status === "arrived" && (
                  <Button variant="outline" size="sm">
                    식사완료
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg"
        onClick={() => {}}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}