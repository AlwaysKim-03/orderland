import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CalendarDays,
  Table
} from "lucide-react";

const initialReservations = [
  {
    id: "1",
    customerName: "김철수",
    phone: "010-1234-5678",
    email: "kim@example.com",
    tables: 2,
    people: 6,
    date: "2024-01-20",
    time: "18:00",
    status: "confirmed", // confirmed, pending, cancelled, completed
    specialRequests: "창가 자리 부탁드립니다.",
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    customerName: "이영희",
    phone: "010-9876-5432",
    email: "lee@example.com",
    tables: 1,
    people: 2,
    date: "2024-01-21",
    time: "19:30",
    status: "pending",
    specialRequests: "",
    createdAt: "2024-01-16T14:20:00Z"
  }
];

const statusConfig = {
  confirmed: {
    label: "확정",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle
  },
  pending: {
    label: "대기중",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle
  },
  cancelled: {
    label: "취소됨",
    color: "bg-red-100 text-red-800",
    icon: XCircle
  },
  completed: {
    label: "완료",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle
  }
};

export default function AdminReservationPage() {
  const [reservations, setReservations] = useState(initialReservations);
  const [isAddReservationOpen, setIsAddReservationOpen] = useState(false);
  const [isEditReservationOpen, setIsEditReservationOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  const handleAddReservation = (reservationData) => {
    const newReservation = {
      ...reservationData,
      id: Date.now().toString(),
      status: "pending",
      createdAt: new Date().toISOString()
    };
    setReservations([...reservations, newReservation]);
    setIsAddReservationOpen(false);
    toast({
      title: "예약 추가됨",
      description: `${reservationData.customerName}님의 예약이 추가되었습니다.`,
    });
  };

  const handleEditReservation = (reservationData) => {
    setReservations(reservations.map(item => 
      item.id === reservationData.id ? reservationData : item
    ));
    setIsEditReservationOpen(false);
    setEditingReservation(null);
    toast({
      title: "예약 수정됨",
      description: `${reservationData.customerName}님의 예약이 수정되었습니다.`,
    });
  };

  const handleDeleteReservation = (reservationId) => {
    const reservation = reservations.find(item => item.id === reservationId);
    setReservations(reservations.filter(item => item.id !== reservationId));
    toast({
      title: "예약 삭제됨",
      description: `${reservation?.customerName}님의 예약이 삭제되었습니다.`,
    });
  };

  const handleStatusChange = (reservationId, newStatus) => {
    setReservations(reservations.map(item => 
      item.id === reservationId 
        ? { ...item, status: newStatus }
        : item
    ));
    
    const reservation = reservations.find(item => item.id === reservationId);
    const statusText = statusConfig[newStatus]?.label || newStatus;
    
    toast({
      title: "상태 변경됨",
      description: `${reservation?.customerName}님의 예약 상태가 "${statusText}"로 변경되었습니다.`,
    });
  };

  const openEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setIsEditReservationOpen(true);
  };

  const filteredReservations = reservations.filter(reservation => {
    const statusMatch = selectedStatus === "all" || reservation.status === selectedStatus;
    const dateMatch = !selectedDate || reservation.date === selectedDate;
    return statusMatch && dateMatch;
  });

  const sortedReservations = filteredReservations.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA - dateB;
  });

  // 빈 상태 렌더링
  if (sortedReservations.length === 0) {
    return (
      <div className="main-content">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="header-title">예약 관리</h1>
            <p className="header-subtitle">예약된 테이블을 관리하세요</p>
          </div>
          
          <AddReservationDialog
            isOpen={isAddReservationOpen}
            onOpenChange={setIsAddReservationOpen}
            onAdd={handleAddReservation}
          >
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              + 새 예약 추가
            </Button>
          </AddReservationDialog>
        </div>

        {/* 빈 상태 */}
        <Card className="max-w-2xl mx-auto mt-12">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">현재 예약된 테이블이 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              고객들의 예약을 받아 테이블을 효율적으로 관리해보세요.
            </p>
            <AddReservationDialog
              isOpen={isAddReservationOpen}
              onOpenChange={setIsAddReservationOpen}
              onAdd={handleAddReservation}
            >
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                예약 테이블 추가
              </Button>
            </AddReservationDialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="header-title">예약 관리</h1>
          <p className="header-subtitle">총 {sortedReservations.length}개의 예약이 있습니다</p>
        </div>
        
        <AddReservationDialog
          isOpen={isAddReservationOpen}
          onOpenChange={setIsAddReservationOpen}
          onAdd={handleAddReservation}
        >
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            + 새 예약 추가
          </Button>
        </AddReservationDialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">상태</Label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input w-32"
          >
            <option value="all">전체</option>
            <option value="pending">대기중</option>
            <option value="confirmed">확정</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소됨</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="date-filter" className="text-sm font-medium text-gray-700">날짜</Label>
          <Input
            id="date-filter"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-40"
          />
        </div>
      </div>

      {/* Reservations Grid */}
      <div className="space-y-4">
        {sortedReservations.map((reservation) => {
          const statusInfo = statusConfig[reservation.status];
          const StatusIcon = statusInfo?.icon || AlertTriangle;
          
          return (
            <Card key={reservation.id} className="card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">{reservation.customerName}</CardTitle>
                      <Badge className={`text-xs ${statusInfo?.color} border-0`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo?.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditReservation(reservation)}
                      className="text-gray-600 hover:text-orange-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-gray-600 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>예약 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{reservation.customerName}"님의 예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteReservation(reservation.id)}>
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{reservation.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{reservation.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{reservation.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{reservation.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">테이블 {reservation.tables}개</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{reservation.people}명</span>
                  </div>
                </div>

                {reservation.specialRequests && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-gray-600 mb-1">특별 요청</div>
                    <p className="text-sm text-gray-700">{reservation.specialRequests}</p>
                  </div>
                )}

                {/* Status Controls */}
                <div className="border-t pt-4 space-y-3">
                  <div className="text-sm font-medium text-gray-600 mb-2">상태 변경</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={reservation.status === status ? "default" : "outline"}
                        onClick={() => handleStatusChange(reservation.id, status)}
                        className={`text-xs h-7 ${
                          reservation.status === status 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <config.icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedReservations.length === 0 && (
        <div className="text-center py-12">
          <CalendarDays className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            예약이 없습니다
          </h3>
          <p className="text-gray-500">
            새로운 예약을 추가해보세요.
          </p>
        </div>
      )}

      {/* Edit Reservation Dialog */}
      {editingReservation && (
        <EditReservationDialog
          reservation={editingReservation}
          isOpen={isEditReservationOpen}
          onOpenChange={setIsEditReservationOpen}
          onEdit={handleEditReservation}
        />
      )}
    </div>
  );
}

// Add Reservation Dialog Component
function AddReservationDialog({ 
  children, 
  isOpen, 
  onOpenChange, 
  onAdd 
}) {
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    tables: 1,
    people: 1,
    date: "",
    time: "",
    specialRequests: ""
  });

  // 시간 슬롯 옵션
  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.customerName && formData.phone && formData.date && formData.time) {
      onAdd({
        ...formData,
        tables: parseInt(formData.tables),
        people: parseInt(formData.people)
      });
      setFormData({
        customerName: "",
        phone: "",
        email: "",
        tables: 1,
        people: 1,
        date: "",
        time: "",
        specialRequests: ""
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">예약 추가</DialogTitle>
          <DialogDescription className="text-gray-600">
            새로운 예약을 추가합니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="customer-name" className="text-sm font-medium text-gray-700">예약자명 *</Label>
            <Input
              id="customer-name"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              placeholder="예약자 이름을 입력하세요"
              className="input"
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">전화번호 *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="010-1234-5678"
              className="input"
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">이메일</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="email@example.com"
              className="input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tables" className="text-sm font-medium text-gray-700">테이블 수 *</Label>
              <Input
                id="tables"
                type="number"
                min="1"
                value={formData.tables}
                onChange={(e) => setFormData({...formData, tables: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <Label htmlFor="people" className="text-sm font-medium text-gray-700">인원 수 *</Label>
              <Input
                id="people"
                type="number"
                min="1"
                value={formData.people}
                onChange={(e) => setFormData({...formData, people: e.target.value})}
                className="input"
              />
            </div>
          </div>
          
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">예약 날짜 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="input"
              />
            </div>
          
            <div>
            <Label className="text-sm font-medium text-gray-700">예약 시간 *</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={formData.time === time ? "default" : "outline"}
                  onClick={() => setFormData({...formData, time})}
                  className="text-sm"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="special-requests" className="text-sm font-medium text-gray-700">특별 요청</Label>
            <Textarea
              id="special-requests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
              placeholder="창가 자리, 생일 축하 등 특별 요청사항"
              className="input min-h-[80px]"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="btn-secondary">
              취소
            </Button>
            <Button type="submit" disabled={!formData.customerName || !formData.phone || !formData.date || !formData.time} className="btn-primary">
              추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Reservation Dialog Component
function EditReservationDialog({ 
  reservation, 
  isOpen, 
  onOpenChange, 
  onEdit 
}) {
  const [formData, setFormData] = useState({
    customerName: reservation.customerName,
    phone: reservation.phone,
    email: reservation.email,
    tables: reservation.tables.toString(),
    people: reservation.people.toString(),
    date: reservation.date,
    time: reservation.time,
    specialRequests: reservation.specialRequests || "",
    status: reservation.status
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.customerName && formData.phone && formData.date && formData.time) {
      onEdit({
        ...reservation,
        ...formData,
        tables: parseInt(formData.tables),
        people: parseInt(formData.people)
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">예약 수정</DialogTitle>
          <DialogDescription className="text-gray-600">
            예약 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-customer-name" className="text-sm font-medium text-gray-700">예약자명 *</Label>
            <Input
              id="edit-customer-name"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              placeholder="예약자 이름을 입력하세요"
              className="input"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">전화번호 *</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="010-1234-5678"
              className="input"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">이메일</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="email@example.com"
              className="input"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-tables" className="text-sm font-medium text-gray-700">테이블 수 *</Label>
              <Input
                id="edit-tables"
                type="number"
                min="1"
                value={formData.tables}
                onChange={(e) => setFormData({...formData, tables: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <Label htmlFor="edit-people" className="text-sm font-medium text-gray-700">인원 수 *</Label>
              <Input
                id="edit-people"
                type="number"
                min="1"
                value={formData.people}
                onChange={(e) => setFormData({...formData, people: e.target.value})}
                className="input"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-date" className="text-sm font-medium text-gray-700">예약 날짜 *</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <Label htmlFor="edit-time" className="text-sm font-medium text-gray-700">예약 시간 *</Label>
              <Input
                id="edit-time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="input"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">상태</Label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="input"
            >
              <option value="pending">대기중</option>
              <option value="confirmed">확정</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="edit-special-requests" className="text-sm font-medium text-gray-700">특별 요청</Label>
            <Textarea
              id="edit-special-requests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
              placeholder="창가 자리, 생일 축하 등 특별 요청사항"
              className="input min-h-[80px]"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="btn-secondary">
              취소
            </Button>
            <Button type="submit" disabled={!formData.customerName || !formData.phone || !formData.date || !formData.time} className="btn-primary">
              저장
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 