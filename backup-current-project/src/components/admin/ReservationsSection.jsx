import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  User, 
  Phone,
  Mail,
  MapPin,
  Users, 
  Clock,
  Check,
  X,
  Eye
} from "lucide-react";
import { toast } from "sonner";

export function ReservationsSection({ reservations = [] }) {
  const [loading, setLoading] = useState(false);

const getStatusBadge = (status) => {
  switch (status) {
    case "pending":
      case "waiting":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2 py-1">대기중</Badge>;
      case "approved":
    case "confirmed":
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">승인</Badge>;
    case "rejected":
    case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs px-2 py-1">거절</Badge>;
    default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs px-2 py-1">대기중</Badge>;
  }
  };

  const handleApprove = async (reservationId) => {
    setLoading(true);
    try {
      // 실제 승인 로직 구현
      toast.success("예약이 승인되었습니다.");
    } catch (error) {
      toast.error("예약 승인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reservationId) => {
    setLoading(true);
    try {
      // 실제 거절 로직 구현
      toast.success("예약이 거절되었습니다.");
    } catch (error) {
      toast.error("예약 거절에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = reservations.filter(r => r.status === 'pending' || r.status === 'waiting').length;
  const approvedCount = reservations.filter(r => r.status === 'approved' || r.status === 'confirmed').length;
  const rejectedCount = reservations.filter(r => r.status === 'rejected' || r.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">예약 현황</h2>
          <p className="text-sm text-gray-600 mt-1">
            고객 예약 요청을 확인하고 관리하세요
          </p>
        </div>
        <Button variant="outline" className="border-gray-300 text-gray-700 text-sm px-4 py-2">
          전체 예약 보기
          </Button>
        </div>

      {/* 예약 목록 */}
      {reservations.length === 0 ? (
        <Card className="bg-white border border-gray-200 rounded-lg">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <div className="text-lg font-medium text-gray-900 mb-2">예약이 없습니다</div>
            <div className="text-sm text-gray-600">
              아직 예약 요청이 없습니다. 새로운 예약을 기다리고 있습니다.
          </div>
          </CardContent>
        </Card>
        ) : (
          <div className="space-y-4">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 고객 정보 */}
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{reservation.customerName}</p>
                        <p className="text-xs text-gray-500">예약번호: {reservation.id.slice(-8)}</p>
                      </div>
                      <div className="ml-auto">
                        {getStatusBadge(reservation.status)}
                    </div>
                </div>

                    {/* 예약 상세 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{reservation.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{reservation.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">테이블 {reservation.tableNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{reservation.guestCount}명</span>
                </div>
                  <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{reservation.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{reservation.time}</span>
                  </div>
                </div>

                    {/* 요청사항 */}
                {reservation.specialRequests && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">요청사항: {reservation.specialRequests}</p>
                  </div>
                )}

                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                      {(reservation.status === 'pending' || reservation.status === 'waiting') ? (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1 h-8"
                            onClick={() => handleApprove(reservation.id)}
                            disabled={loading}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            수락
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="text-xs px-3 py-1 h-8"
                            onClick={() => handleReject(reservation.id)}
                            disabled={loading}
                          >
                            <X className="w-3 h-3 mr-1" />
                            거절
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs px-3 py-1 h-8"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          상세
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
    </div>
  );
} 