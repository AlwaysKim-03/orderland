import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  Check,
  X,
  Eye
} from "lucide-react";
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  tableNumber?: string;
  partySize: number;
  date: Date;
  time: string;
  specialRequests?: string[];
  requests?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

interface ReservationsSectionProps {
  reservations?: Reservation[];
  onReservationUpdate?: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-warning/10 text-warning border-warning">대기중</Badge>;
    case "confirmed":
      return <Badge className="bg-success/10 text-success border-success">승인</Badge>;
    case "cancelled":
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-destructive">거절</Badge>;
    case "completed":
      return <Badge className="bg-primary/10 text-primary border-primary">완료</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getStatusButtons = (status: string, reservationId: string, onUpdate: (id: string, newStatus: string) => void) => {
  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="bg-success hover:bg-success/90"
          onClick={() => onUpdate(reservationId, 'confirmed')}
        >
          <Check className="w-4 h-4 mr-1" />
          수락
        </Button>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => onUpdate(reservationId, 'cancelled')}
        >
          <X className="w-4 h-4 mr-1" />
          거절
        </Button>
      </div>
    );
  }
  return (
    <Button size="sm" variant="outline">
      <Eye className="w-4 h-4 mr-1" />
      상세
    </Button>
  );
};

export function ReservationsSection({ reservations = [], onReservationUpdate }: ReservationsSectionProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    setLoading(true);
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      if (onReservationUpdate) {
        onReservationUpdate();
      }
    } catch (error) {
      console.error('예약 상태 업데이트 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            예약 현황
          </CardTitle>
          <CardDescription>
            고객 예약 요청을 확인하고 관리하세요
          </CardDescription>
        </div>
        <Button variant="outline">
          전체 예약 보기
        </Button>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <div className="text-lg font-medium text-gray-900 mb-2">예약이 없습니다</div>
            <div className="text-sm text-gray-600">
              아직 들어온 예약이 없습니다. 새로운 예약을 기다리고 있습니다.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div 
                key={reservation.id} 
                className="p-4 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{reservation.customerName}</h4>
                    </div>
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.phone}</span>
                  </div>
                  {reservation.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{reservation.email}</span>
                    </div>
                  )}
                  {reservation.tableNumber && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{reservation.tableNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.partySize}명</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatDate(reservation.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{reservation.time}</span>
                  </div>
                </div>

                {(reservation.requests || reservation.specialRequests) && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">요청사항:</span> {reservation.requests || reservation.specialRequests?.join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  {getStatusButtons(reservation.status, reservation.id, handleStatusUpdate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}