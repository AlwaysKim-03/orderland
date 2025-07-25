import React, { useState, useEffect } from 'react';
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
import { 
  Calendar,
  Users, 
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  X,
  Eye,
  Plus,
  Filter
} from "lucide-react";
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';
import ReservationModal from '../../components/ReservationModal';

const getStatusBadge = (status) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-warning/10 text-warning border-warning">대기중</Badge>;
    case "confirmed":
      return <Badge className="bg-success/10 text-success border-success">승인</Badge>;
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-destructive">거절</Badge>;
    case "cancelled":
      return <Badge className="bg-muted/10 text-muted-foreground border-muted">취소</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getStatusButtons = (status, reservationId, onStatusUpdate) => {
  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="bg-success hover:bg-success/90"
          onClick={() => onStatusUpdate(reservationId, "confirmed")}
        >
          <Check className="w-4 h-4 mr-1" />
          수락
        </Button>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => onStatusUpdate(reservationId, "rejected")}
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

export default function ReservationsTab({ userInfo }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, rejected
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // 예약 데이터 가져오기
  useEffect(() => {
    if (!userInfo?.uid) return;

    const q = query(
      collection(db, "reservations"),
      where("storeId", "==", userInfo.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReservations(reservationData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userInfo?.uid]);

  // 상태 업데이트 함수
  const handleStatusUpdate = async (reservationId, newStatus) => {
    try {
      await updateDoc(doc(db, "reservations", reservationId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('예약 상태 업데이트 실패:', error);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  // 필터링된 예약 목록
  const filteredReservations = reservations.filter(reservation => {
    if (filter !== 'all' && reservation.status !== filter) return false;
    if (selectedDate && reservation.date !== selectedDate) return false;
    return true;
  }).sort((a, b) => {
    // 날짜와 시간으로 정렬
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB - dateA; // 최신순
  });

  // 통계 계산
  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    rejected: reservations.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return <div className="p-6">예약 데이터를 불러오는 중...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">예약 관리</h2>
          <p className="text-gray-600">고객 예약 요청을 확인하고 관리하세요</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => {
            setSelectedReservation(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          새 예약 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 예약</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-success">{stats.confirmed}</p>
              </div>
              <Check className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">거절됨</p>
                <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
              </div>
              <X className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium">상태</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="ml-2 p-2 border rounded-md"
              >
                <option value="all">전체</option>
                <option value="pending">대기중</option>
                <option value="confirmed">승인됨</option>
                <option value="rejected">거절됨</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">날짜</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="ml-2 p-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예약 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>예약 목록</CardTitle>
          <CardDescription>
            총 {filteredReservations.length}개의 예약이 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              예약이 없습니다.
            </div>
          ) : (
            <div className="table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고객명</TableHead>
                  <TableHead>날짜/시간</TableHead>
                  <TableHead>인원</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.customerName}</p>
                          <p className="text-sm text-muted-foreground">#{reservation.id.slice(-6)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.date}</p>
                          <p className="text-sm text-muted-foreground">{reservation.time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{reservation.partySize}명</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{reservation.phone}</p>
                          <p className="text-sm text-muted-foreground">{reservation.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reservation.status)}
                    </TableCell>
                    <TableCell>
                      {getStatusButtons(reservation.status, reservation.id, handleStatusUpdate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 예약 모달 */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReservation(null);
        }}
        reservation={selectedReservation}
        storeId={userInfo?.uid}
        onSuccess={() => {
          // 예약 목록이 자동으로 업데이트됩니다 (onSnapshot 때문)
        }}
      />
    </div>
  );
} 