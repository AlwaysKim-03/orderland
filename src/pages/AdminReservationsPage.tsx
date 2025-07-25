import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarIcon, 
  Clock, 
  Users, 
  Phone, 
  Plus, 
  Minus, 
  Edit, 
  Trash2,
  MessageSquare,
  CheckCircle,
  Timer,
  Baby,
  Volume2,
  Utensils,
  Car
} from "lucide-react";
import { format, addHours, differenceInHours, isBefore } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { checkReservationReminders } from "../utils/reservationReminder";

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: Date;
  time: string;
  partySize: number;
  specialRequests: string[];
  reminderSent: boolean;
  reminderScheduled: boolean;
}

const specialRequestOptions = [
  { id: "baby-chair", label: "아기의자 필요", icon: Baby },
  { id: "quiet-seat", label: "조용한 자리 요청", icon: Volume2 },
  { id: "private-room", label: "프라이빗 룸 요청", icon: Utensils },
  { id: "parking", label: "주차 공간 필요", icon: Car },
];

const timeSlots = [
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00"
];

export default function AdminReservationsPage() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth 상태 감지
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Firebase에서 예약 데이터 로드
  useEffect(() => {
    if (!user) return;

    const reservationsQuery = query(
      collection(db, 'reservations'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(reservationsQuery, (snapshot) => {
      const reservationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customerName: data.customerName || '',
          phone: data.phone || '',
          date: data.date?.toDate() || new Date(),
          time: data.time || '',
          partySize: data.partySize || 1,
          specialRequests: data.specialRequests || [],
          reminderSent: data.reminderSent || false,
          reminderScheduled: data.reminderScheduled || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Reservation;
      });
      
      setReservations(reservationsData);
      setLoading(false);
    }, (error) => {
      console.error('예약 데이터 로드 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 예약 데이터가 변경될 때마다 리마인드 확인
  useEffect(() => {
    const checkReminders = async () => {
      await checkReservationReminders(db, reservations);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // 1분마다 확인
    return () => clearInterval(interval);
  }, [reservations]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  const handleAddReservation = async () => {
    if (!selectedDate || !selectedTime || !customerName || !phone) {
      toast({
        title: "입력 오류",
        description: "모든 필수 정보를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const reservationData = {
        customerName,
        phone,
        date: selectedDate,
        time: selectedTime,
        partySize,
        specialRequests: selectedRequests,
        reminderSent: false,
        reminderScheduled: true,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Firebase에 예약 저장
      await addDoc(collection(db, "reservations"), reservationData);

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setCustomerName("");
      setPhone("");
      setPartySize(2);
      setSelectedRequests([]);
      setIsDialogOpen(false);

      toast({
        title: "예약 등록 완료",
        description: `${customerName}님의 예약이 등록되었습니다.`,
      });
    } catch (error) {
      console.error('예약 저장 실패:', error);
      toast({
        title: "저장 실패",
        description: "예약 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reservations", id));
      toast({
        title: "예약 삭제",
        description: "예약이 삭제되었습니다.",
      });
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      toast({
        title: "삭제 실패",
        description: "예약 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setCustomerName(reservation.customerName);
    setPhone(reservation.phone);
    setSelectedDate(reservation.date);
    setSelectedTime(reservation.time);
    setPartySize(reservation.partySize);
    setSelectedRequests(reservation.specialRequests);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleUpdateReservation = async () => {
    if (!selectedDate || !selectedTime || !customerName || !phone || !editingReservation) {
      toast({
        title: "입력 오류",
        description: "모든 필수 정보를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedData = {
        customerName,
        phone,
        date: selectedDate,
        time: selectedTime,
        partySize,
        specialRequests: selectedRequests,
        updatedAt: new Date()
      };

      // Firebase에서 예약 업데이트
      await updateDoc(doc(db, "reservations", editingReservation.id), updatedData);

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setCustomerName("");
      setPhone("");
      setPartySize(2);
      setSelectedRequests([]);
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingReservation(null);

      toast({
        title: "예약 수정 완료",
        description: `${customerName}님의 예약이 수정되었습니다.`,
      });
    } catch (error) {
      console.error('예약 수정 실패:', error);
      toast({
        title: "수정 실패",
        description: "예약 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingReservation(null);
    // Reset form
    setSelectedDate(undefined);
    setSelectedTime("");
    setCustomerName("");
    setPhone("");
    setPartySize(2);
    setSelectedRequests([]);
  };

  const toggleSpecialRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const getReminderStatus = (reservation: Reservation) => {
    const reservationDateTime = new Date(`${format(reservation.date, 'yyyy-MM-dd')} ${reservation.time}`);
    const now = new Date();
    const hoursUntil = differenceInHours(reservationDateTime, now);

    if (reservation.reminderSent) {
      return { icon: CheckCircle, text: "리마인드 발송됨", variant: "default" as const };
    }
    
    if (hoursUntil <= 2 && hoursUntil > 0) {
      return { icon: Timer, text: "리마인드 예정", variant: "secondary" as const };
    }
    
    if (isBefore(reservationDateTime, now)) {
      return { icon: Timer, text: "방문 시간 경과", variant: "destructive" as const };
    }

    return { icon: Timer, text: "리마인드 대기", variant: "outline" as const };
  };

  const getSmsPreview = (reservation: Reservation) => {
    return `[오더랜드] ${reservation.customerName}님, 오늘 예약하신 방문 시간은 ${reservation.time}입니다. 늦지 않게 방문해주세요 😊`;
  };

  const getSpecialRequestLabel = (requestId: string) => {
    return specialRequestOptions.find(opt => opt.id === requestId)?.label || requestId;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center py-12">
          <h3 className="text-xl font-semibold mb-2">예약 데이터를 불러오는 중입니다...</h3>
          <p className="text-muted-foreground">잠시만 기다려주세요.</p>
        </div>
      </AdminLayout>
    );
  }

  if (reservations.length === 0) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">예약 관리</h1>
              <p className="text-muted-foreground">테이블 예약을 관리하고 고객과 소통하세요</p>
            </div>
          </div>

          <Card className="max-w-2xl mx-auto mt-12">
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">현재 예약된 테이블이 없습니다</h3>
              <p className="text-muted-foreground mb-6">
                첫 예약을 등록하고 고객 관리를 시작해보세요
              </p>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    예약 테이블 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>새 예약 등록</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Customer Name */}
                    <div className="space-y-2">
                      <Label htmlFor="customerName">예약자 성함 *</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="예약자 성함을 입력하세요"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">전화번호 *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <Label>방문 날짜 *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP", { locale: ko }) : "날짜를 선택하세요"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                      <Label>방문 시간 *</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            onClick={() => setSelectedTime(time)}
                            className="text-sm"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Party Size */}
                    <div className="space-y-2">
                      <Label>방문 인원수</Label>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPartySize(Math.max(1, partySize - 1))}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-2xl font-semibold w-12 text-center">{partySize}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPartySize(partySize + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div className="space-y-2">
                      <Label>특이사항 (선택)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {specialRequestOptions.map((option) => {
                          const Icon = option.icon;
                          const isSelected = selectedRequests.includes(option.id);
                          return (
                            <Button
                              key={option.id}
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => toggleSpecialRequest(option.id)}
                              className="justify-start gap-2 h-auto py-3"
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm">{option.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                        취소
                      </Button>
                      <Button onClick={handleAddReservation} className="flex-1">
                        예약 등록
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">예약 관리</h1>
            <p className="text-muted-foreground">총 {reservations.length}개의 예약이 있습니다</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-5 h-5" />
                새 예약 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "예약 수정" : "새 예약 등록"}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customerName">예약자 성함 *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="예약자 성함을 입력하세요"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호 *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label>방문 날짜 *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ko }) : "날짜를 선택하세요"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <Label>방문 시간 *</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Party Size */}
                <div className="space-y-2">
                  <Label>방문 인원수</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-semibold w-12 text-center">{partySize}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPartySize(partySize + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Special Requests */}
                <div className="space-y-2">
                  <Label>특이사항 (선택)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {specialRequestOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedRequests.includes(option.id);
                      return (
                        <Button
                          key={option.id}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => toggleSpecialRequest(option.id)}
                          className="justify-start gap-2 h-auto py-3"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{option.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={isEditMode ? handleCancelEdit : () => setIsDialogOpen(false)} className="flex-1">
                    취소
                  </Button>
                  <Button onClick={isEditMode ? handleUpdateReservation : handleAddReservation} className="flex-1">
                    {isEditMode ? "예약 수정" : "예약 등록"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reservations List */}
        <div className="space-y-4">
          {reservations.map((reservation) => {
            const reminderStatus = getReminderStatus(reservation);
            const ReminderIcon = reminderStatus.icon;
            
            return (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold">{reservation.customerName}</h3>
                        <Badge variant={reminderStatus.variant} className="gap-1">
                          <ReminderIcon className="w-3 h-3" />
                          {reminderStatus.text}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span>{format(reservation.date, "MM월 dd일", { locale: ko })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{reservation.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{reservation.partySize}명</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{reservation.phone}</span>
                        </div>
                      </div>

                      {reservation.specialRequests.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {reservation.specialRequests.map((requestId) => (
                            <Badge key={requestId} variant="secondary" className="text-xs">
                              {getSpecialRequestLabel(requestId)}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* SMS Preview */}
                      {(reservation.reminderSent || reservation.reminderScheduled) && (
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">SMS 리마인드 미리보기</span>
                            <Badge variant="outline" className="text-xs">시뮬레이션</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getSmsPreview(reservation)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleEditReservation(reservation)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeleteReservation(reservation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}