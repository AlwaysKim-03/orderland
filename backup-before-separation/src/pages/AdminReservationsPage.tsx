import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, CalendarDays, Users, Phone, Clock, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

interface Reservation {
  id: string;
  customerName: string;
  date: string;
  time: string;
  guests: number;
  phone?: string;
  memos: string[];
  customMemo?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: any;
  updatedAt: any;
  storeId: string;
}

const memoOptions = [
  { id: "baby-chair", label: "🪑 아기의자", value: "아기의자" },
  { id: "quiet-seat", label: "🔕 조용한 자리", value: "조용한 자리" },
  { id: "birthday", label: "🎂 생일파티", value: "생일파티" },
  { id: "other", label: "✏️ 기타", value: "기타" },
];

// 영업 시간 설정 (추후 설정 페이지에서 관리)
const BUSINESS_HOURS = {
  open: "10:00",
  close: "22:00"
};

// 영업 시간 내 예약 가능한 시간 생성
const generateAvailableTimeSlots = () => {
  const slots = [];
  const openTime = parseInt(BUSINESS_HOURS.open.split(':')[0]);
  const closeTime = parseInt(BUSINESS_HOURS.close.split(':')[0]);
  
  for (let hour = openTime; hour < closeTime; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  
  return slots;
};

// 현재 시간 이후 예약 가능한 시간만 필터링
const getAvailableTimeSlots = (selectedDate: string) => {
  const allSlots = generateAvailableTimeSlots();
  const today = new Date().toISOString().split('T')[0];
  
  // 선택된 날짜가 오늘이 아니면 모든 시간 표시
  if (selectedDate !== today) {
    return allSlots;
  }
  
  // 오늘인 경우 현재 시간 이후만 표시
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  return allSlots.filter(time => {
    const [hour, minute] = time.split(':').map(Number);
    return hour > currentHour || (hour === currentHour && minute > currentMinute);
  });
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    date: "",
    time: "",
    guests: 1,
    phone: "",
    memos: [] as string[],
    customMemo: "",
  });
  const { toast } = useToast();

  // Firebase에서 예약 데이터 실시간 가져오기
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('사용자가 로그인되지 않았습니다.');
      return;
    }

    console.log('Firebase 예약 데이터 로딩 시작...');
    
    // 현재 사용자의 매장 ID로 예약 데이터 조회
    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('storeId', '==', currentUser.uid),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );

    const unsubscribe = onSnapshot(reservationsQuery, (snapshot) => {
      console.log('Firebase 예약 스냅샷 받음:', snapshot.docs.length, '개 문서');
      
      const reservationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
      
      console.log('Firebase 예약 데이터:', reservationsData);
      setReservations(reservationsData);
    }, (error) => {
      console.error('Firebase 예약 데이터 로드 오류:', error);
      toast({
        title: "예약 데이터 로드 실패",
        description: "예약 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  // 인원 수 증감 함수
  const incrementGuests = () => {
    setFormData(prev => ({ ...prev, guests: Math.min(prev.guests + 1, 20) }));
  };

  const decrementGuests = () => {
    setFormData(prev => ({ ...prev, guests: Math.max(prev.guests - 1, 1) }));
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      date: "",
      time: "",
      guests: 1,
      phone: "",
      memos: [],
      customMemo: "",
    });
    setEditingReservation(null);
  };

  const handleSave = async () => {
    if (!formData.customerName || !formData.date || !formData.time) {
      toast({
        title: "입력 오류",
        description: "예약자명, 날짜, 시간은 필수 입력 항목입니다.",
        variant: "destructive",
      });
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({
        title: "로그인 필요",
        description: "예약을 저장하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    const memos = [...formData.memos];
    if (formData.memos.includes("기타") && formData.customMemo) {
      memos.push(formData.customMemo);
    }

    try {
      if (editingReservation) {
        // 예약 수정
        const reservationRef = doc(db, 'reservations', editingReservation.id);
        await updateDoc(reservationRef, {
          customerName: formData.customerName,
          date: formData.date,
          time: formData.time,
          guests: formData.guests,
          phone: formData.phone,
          memos: memos.filter(memo => memo !== "기타"),
          customMemo: formData.customMemo,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: "예약이 수정되었습니다",
          description: `${formData.customerName}님의 예약이 수정되었습니다.`,
        });
      } else {
        // 새 예약 추가
        const reservationData = {
          customerName: formData.customerName,
          date: formData.date,
          time: formData.time,
          guests: formData.guests,
          phone: formData.phone,
          memos: memos.filter(memo => memo !== "기타"),
          customMemo: formData.customMemo,
          status: 'confirmed' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          storeId: currentUser.uid,
        };

        await addDoc(collection(db, 'reservations'), reservationData);

        toast({
          title: "예약이 등록되었습니다",
          description: `${formData.customerName}님의 예약이 등록되었습니다.`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('예약 저장 오류:', error);
      toast({
        title: "예약 저장 실패",
        description: "예약을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setFormData({
      customerName: reservation.customerName,
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      phone: reservation.phone || "",
      memos: reservation.customMemo ? [...reservation.memos, "기타"] : reservation.memos,
      customMemo: reservation.customMemo || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const reservation = reservations.find(r => r.id === id);
    
    try {
      await deleteDoc(doc(db, 'reservations', id));
      
      toast({
        title: "예약이 삭제되었습니다",
        description: `${reservation?.customerName}님의 예약이 삭제되었습니다.`,
      });
    } catch (error) {
      console.error('예약 삭제 오류:', error);
      toast({
        title: "예약 삭제 실패",
        description: "예약을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: Reservation['status']) => {
    try {
      await updateDoc(doc(db, 'reservations', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      const reservation = reservations.find(r => r.id === id);
      toast({
        title: "예약 상태 변경",
        description: `${reservation?.customerName}님의 예약 상태가 변경되었습니다.`,
      });
    } catch (error) {
      console.error('예약 상태 변경 오류:', error);
      toast({
        title: "상태 변경 실패",
        description: "예약 상태를 변경하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleMemoChange = (memo: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, memos: [...prev.memos, memo] }));
    } else {
      setFormData(prev => ({ ...prev, memos: prev.memos.filter(m => m !== memo) }));
      if (memo === "기타") {
        setFormData(prev => ({ ...prev, customMemo: "" }));
      }
    }
  };

  const formatDate = (dateString: string) => {
    return dateString.replace(/-/g, '.');
  };

  const formatTime = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const minute = time.split(':')[1];
    const period = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${displayHour}:${minute}`;
  };

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500 text-white">확정</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">대기</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">취소</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500 text-white">완료</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">알 수 없음</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">예약 관리</h1>
            <p className="text-muted-foreground mt-2">
              고객의 테이블 예약을 확인하고 응대 준비를 해보세요.
            </p>
          </div>
        </div>

        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 text-center">
            <CalendarDays className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              현재 등록된 예약이 없습니다
            </h3>
            <p className="text-muted-foreground mb-6">
              첫 번째 예약을 등록해보세요.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-[#FF914D] hover:bg-[#E8822E]">
                  <Plus className="w-4 h-4 mr-2" />
                  예약 추가하기
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingReservation ? "예약 수정" : "새 예약 등록"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">예약 날짜</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">예약 시간</Label>
                      <Select value={formData.time} onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="시간 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTimeSlots(formData.date).map((time) => (
                            <SelectItem key={time} value={time}>
                              {formatTime(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.date && getAvailableTimeSlots(formData.date).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          선택한 날짜에 예약 가능한 시간이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">예약자명</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="이름 입력"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guests">인원 수</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={decrementGuests}
                          disabled={formData.guests <= 1}
                          className="h-9 w-9"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <Input
                            id="guests"
                            type="number"
                            min="1"
                            max="20"
                            value={formData.guests}
                            onChange={(e) => setFormData(prev => ({ ...prev, guests: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) }))}
                            className="text-center font-medium"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={incrementGuests}
                          disabled={formData.guests >= 20}
                          className="h-9 w-9"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        최대 20명까지 예약 가능
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호 (선택)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-0000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>요청사항 메모 (선택)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {memoOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={formData.memos.includes(option.value)}
                            onCheckedChange={(checked) => handleMemoChange(option.value, checked as boolean)}
                          />
                          <Label htmlFor={option.id} className="text-sm">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.memos.includes("기타") && (
                      <Textarea
                        value={formData.customMemo}
                        onChange={(e) => setFormData(prev => ({ ...prev, customMemo: e.target.value }))}
                        placeholder="기타 요청사항을 입력해주세요"
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    취소
                  </Button>
                  <Button onClick={handleSave} className="flex-1 bg-[#FF914D] hover:bg-[#E8822E]">
                    {editingReservation ? "수정" : "등록"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                총 {reservations.length}개의 예약
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-[#FF914D] hover:bg-[#E8822E]">
                    <Plus className="w-4 h-4 mr-2" />
                    예약 추가하기
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingReservation ? "예약 수정" : "새 예약 등록"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">예약 날짜</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">예약 시간</Label>
                        <Select value={formData.time} onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="시간 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableTimeSlots(formData.date).map((time) => (
                              <SelectItem key={time} value={time}>
                                {formatTime(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.date && getAvailableTimeSlots(formData.date).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            선택한 날짜에 예약 가능한 시간이 없습니다.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">예약자명</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          placeholder="이름 입력"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guests">인원 수</Label>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={decrementGuests}
                            disabled={formData.guests <= 1}
                            className="h-9 w-9"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="flex-1 text-center">
                            <Input
                              id="guests"
                              type="number"
                              min="1"
                              max="20"
                              value={formData.guests}
                              onChange={(e) => setFormData(prev => ({ ...prev, guests: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) }))}
                              className="text-center font-medium"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={incrementGuests}
                            disabled={formData.guests >= 20}
                            className="h-9 w-9"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          최대 20명까지 예약 가능
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">전화번호 (선택)</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="010-0000-0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>요청사항 메모 (선택)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {memoOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={formData.memos.includes(option.value)}
                              onCheckedChange={(checked) => handleMemoChange(option.value, checked as boolean)}
                            />
                            <Label htmlFor={option.id} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.memos.includes("기타") && (
                        <Textarea
                          value={formData.customMemo}
                          onChange={(e) => setFormData(prev => ({ ...prev, customMemo: e.target.value }))}
                          placeholder="기타 요청사항을 입력해주세요"
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      취소
                    </Button>
                    <Button onClick={handleSave} className="flex-1 bg-[#FF914D] hover:bg-[#E8822E]">
                      {editingReservation ? "수정" : "등록"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {reservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-bold text-lg text-foreground">
                            {reservation.customerName}
                          </h3>
                          {getStatusBadge(reservation.status)}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDays className="w-4 h-4" />
                            <span>{formatDate(reservation.date)}</span>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{formatTime(reservation.time)}</span>
                            <Users className="w-4 h-4 ml-2" />
                            <span>{reservation.guests}명</span>
                          </div>
                        </div>
                        
                        {reservation.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Phone className="w-4 h-4" />
                            <span>{reservation.phone}</span>
                          </div>
                        )}

                        {(reservation.memos.length > 0 || reservation.customMemo) && (
                          <div className="flex flex-wrap gap-1">
                            {reservation.memos.map((memo, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {memo}
                              </Badge>
                            ))}
                            {reservation.customMemo && (
                              <Badge variant="secondary" className="text-xs">
                                {reservation.customMemo}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* 상태 변경 드롭다운 */}
                        <Select 
                          value={reservation.status} 
                          onValueChange={(value) => handleStatusChange(reservation.id, value as Reservation['status'])}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">대기</SelectItem>
                            <SelectItem value="confirmed">확정</SelectItem>
                            <SelectItem value="completed">완료</SelectItem>
                            <SelectItem value="cancelled">취소</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(reservation)}
                          className="hover:bg-muted"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>예약을 삭제하시겠습니까?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {reservation.customerName}님의 예약이 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(reservation.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}