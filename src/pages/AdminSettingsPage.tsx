import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import QRCode from 'qrcode';
import {
  Store,
  User,
  QrCode,
  Bell,
  Menu,
  BarChart3,
  MessageSquare,
  Settings,
  Clock,
  MapPin,
  Phone,
  Mail,
  Key,
  Download,
  Upload,
  Moon,
  Sun,
  Globe,
  Info,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Edit3,
  Trash2
} from "lucide-react";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

const days = [
  { id: "monday", label: "월요일" },
  { id: "tuesday", label: "화요일" },
  { id: "wednesday", label: "수요일" },
  { id: "thursday", label: "목요일" },
  { id: "friday", label: "금요일" },
  { id: "saturday", label: "토요일" },
  { id: "sunday", label: "일요일" },
];

const qrSizes = [
  { id: "small", label: "소 (200x200)", size: "200" },
  { id: "medium", label: "중 (400x400)", size: "400" },
  { id: "large", label: "대 (600x600)", size: "600" },
];

const messageTemplates = {
  orderComplete: [
    "주문이 완료되었습니다. 맛있게 드세요! 😊",
    "주문해주셔서 감사합니다. 곧 준비해드릴게요!",
    "주문 접수 완료! 최고의 맛으로 준비하겠습니다.",
  ],
  servingComplete: [
    "주문하신 음식이 준비되었습니다. 맛있게 드세요! 🍽️",
    "따끈따끈한 요리가 나왔어요! 즐거운 식사시간 되세요.",
    "음식 준비 완료! 최고의 맛을 경험해보세요.",
  ],
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode, setDarkMode, theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("store");
  
  // Store Info State
  const [storeName, setStoreName] = useState("오더랜드");
  const [storeAddress, setStoreAddress] = useState("서울시 강남구 테헤란로 123");
  const [storePhone, setStorePhone] = useState("02-1234-5678");
  const [storeEmail, setStoreEmail] = useState("contact@orderland.com");
  const [storeDescription, setStoreDescription] = useState("최고의 맛을 제공하는 오더랜드입니다.");
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    monday: { open: "09:00", close: "22:00", closed: false },
    tuesday: { open: "09:00", close: "22:00", closed: false },
    wednesday: { open: "09:00", close: "22:00", closed: false },
    thursday: { open: "09:00", close: "22:00", closed: false },
    friday: { open: "09:00", close: "22:00", closed: false },
    saturday: { open: "10:00", close: "23:00", closed: false },
    sunday: { open: "", close: "", closed: true },
  });

  // Account Settings State
  const [adminEmail, setAdminEmail] = useState("admin@orderland.com");
  const [adminName, setAdminName] = useState("관리자");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // QR & Table Settings State
  const [selectedQrSize, setSelectedQrSize] = useState("medium");
  
  // Get tables from localStorage to sync with TableManagement component
  const getTablesFromStorage = () => {
    try {
      const stored = localStorage.getItem('orderland-tables');
      if (stored) {
        const parsedTables = JSON.parse(stored);
        return parsedTables.map((table: any) => ({
          id: table.id,
          name: table.name,
          url: `${window.location.origin}/order/donkatsu/${table.id.toString().padStart(2, '0')}`,
          qrGenerated: true
        }));
      }
    } catch (error) {
      console.error('Error loading tables from storage:', error);
    }
    return [];
  };
  
  const [tables, setTables] = useState(getTablesFromStorage);

  // Listen for storage changes to sync with TableManagement component
  useEffect(() => {
    const handleStorageChange = () => {
      setTables(getTablesFromStorage());
    };

    // Listen for storage events from other components
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event when tables change within the same tab
    window.addEventListener('tablesUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tablesUpdated', handleStorageChange);
    };
  }, []);

  // Notification Settings State
  const [reservationReminder, setReservationReminder] = useState(true);
  const [reminderTiming, setReminderTiming] = useState("2");
  const [cookingSound, setCookingSound] = useState(true);

  // Menu Settings State
  const [defaultBadge, setDefaultBadge] = useState("none");
  const [autoHideSoldOut, setAutoHideSoldOut] = useState(true);

  // Sales & Data Settings State
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);
  const [visitorTracking, setVisitorTracking] = useState("estimated");

  // Customer Messages State
  const [customMessages, setCustomMessages] = useState({
    orderComplete: messageTemplates.orderComplete[0],
    servingComplete: messageTemplates.servingComplete[0],
  });
  const [useCustomMessage, setUseCustomMessage] = useState({
    orderComplete: false,
    servingComplete: false,
  });

  // QR Code generation function
  const generateQRCode = async (tableId: number, tableName: string) => {
    try {
      // 실제 주문페이지 URL 생성
      const orderUrl = `${window.location.origin}/order/donkatsu/${tableId.toString().padStart(2, '0')}`;
      const qrDataUrl = await QRCode.toDataURL(orderUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `table-${tableId.toString().padStart(2, '0')}-qr.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR 코드 다운로드 완료",
        description: `${tableName} QR 코드가 다운로드되었습니다.`,
        className: "bg-green-50 text-green-800 border-green-200",
      });
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      toast({
        title: "QR 코드 생성 실패",
        description: "QR 코드 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // Generate QR code for display
  const generateQRForDisplay = async (tableId: number): Promise<string> => {
    try {
      const orderUrl = `${window.location.origin}/order/donkatsu/${tableId.toString().padStart(2, '0')}`;
      return await QRCode.toDataURL(orderUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      return '';
    }
  };

  // State for QR codes
  const [qrCodes, setQrCodes] = useState<Record<number, string>>({});
  const [qrLoading, setQrLoading] = useState<Record<number, boolean>>({});

  // Generate QR codes for all tables
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodes: Record<number, string> = {};
      const newQrLoading: Record<number, boolean> = {};
      
      for (const table of tables) {
        newQrLoading[table.id] = true;
        const qrDataUrl = await generateQRForDisplay(table.id);
        newQrCodes[table.id] = qrDataUrl;
        newQrLoading[table.id] = false;
      }
      
      setQrCodes(newQrCodes);
      setQrLoading(newQrLoading);
    };

    if (tables.length > 0) {
      generateAllQRCodes();
    }
  }, [tables]);

  // Enhanced CSV Download function
  const handleDownloadCSV = async () => {
    try {
      toast({
        title: "데이터 수집 중...",
        description: "매출 데이터를 수집하고 있습니다.",
      });

      // Get orders from Firestore with date range
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const ordersQuery = query(
        collection(db, 'orders'),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (orders.length === 0) {
        toast({
          title: "데이터 없음",
          description: "다운로드할 주문 데이터가 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // Enhanced CSV with more detailed information
      const csvHeaders = [
        '주문ID', '주문번호', '테이블번호', '상태', '총액', '주문시간', 
        '메뉴', '수량', '개별가격', '결제상태', '고객정보'
      ];
      
      const csvRows = orders.map((order: any) => {
        const items = order.items || [];
        const itemDetails = items.map((item: any) => 
          `${item.name} (${item.quantity}개 x ${item.price}원)`
        ).join('; ');
        
        const itemNames = items.map((item: any) => item.name).join(', ');
        const itemQuantities = items.map((item: any) => item.quantity).join(', ');
        const itemPrices = items.map((item: any) => item.price).join(', ');
        
        return [
          order.id,
          order.orderNumber || '',
          order.tableNumber || '',
          order.status || '',
          order.totalAmount || 0,
          order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString('ko-KR') : '',
          itemNames,
          itemQuantities,
          itemPrices,
          order.paymentStatus || 'pending',
          `테이블${order.tableNumber}`
        ];
      });

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download CSV file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `매출데이터_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "CSV 다운로드 완료",
        description: `${orders.length}개의 주문 데이터가 포함된 CSV 파일이 다운로드되었습니다.`,
        className: "bg-green-50 text-green-800 border-green-200",
      });
    } catch (error) {
      console.error('CSV 다운로드 오류:', error);
      toast({
        title: "다운로드 실패",
        description: "CSV 파일 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSaveStoreInfo = () => {
    // Save to localStorage for persistence
    const storeInfo = {
      name: storeName,
      address: storeAddress,
      phone: storePhone,
      email: storeEmail,
      description: storeDescription,
      businessHours
    };
    localStorage.setItem('orderland-store-info', JSON.stringify(storeInfo));
    
    toast({
      title: "매장 정보 저장",
      description: "매장 정보가 성공적으로 업데이트되었습니다.",
    });
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword) {
      toast({
        title: "입력 오류",
        description: "현재 비밀번호와 새 비밀번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "비밀번호 길이",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "비밀번호 변경",
      description: "비밀번호가 성공적으로 변경되었습니다.",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleReissueQR = async (tableId: number, tableName: string) => {
    try {
      // Set loading state
      setQrLoading(prev => ({ ...prev, [tableId]: true }));
      
      // Generate new QR code
      const newQrDataUrl = await generateQRForDisplay(tableId);
      setQrCodes(prev => ({ ...prev, [tableId]: newQrDataUrl }));
      
      // Download the new QR code
      const orderUrl = `${window.location.origin}/order/donkatsu/${tableId.toString().padStart(2, '0')}`;
      const qrDataUrl = await QRCode.toDataURL(orderUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `table-${tableId.toString().padStart(2, '0')}-qr.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setQrLoading(prev => ({ ...prev, [tableId]: false }));
      
      toast({
        title: "QR 코드 재발급 완료",
        description: `${tableName} QR 코드가 재생성되고 다운로드되었습니다.`,
        className: "bg-green-50 text-green-800 border-green-200",
      });
    } catch (error) {
      console.error('QR 코드 재발급 오류:', error);
      setQrLoading(prev => ({ ...prev, [tableId]: false }));
      toast({
        title: "QR 코드 재발급 실패",
        description: "QR 코드 재생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEditQR = (tableId: number, tableName: string) => {
    toast({
      title: "QR 코드 변경",
      description: `${tableName} QR 코드 변경 기능은 준비 중입니다.`,
    });
  };

  const handleBusinessHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleMessageTemplateSelect = (type: keyof typeof customMessages, template: string) => {
    setCustomMessages(prev => ({
      ...prev,
      [type]: template
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: "클립보드에 복사되었습니다.",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">설정</h1>
          <p className="text-muted-foreground">매장 운영에 필요한 모든 설정을 관리하세요</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="store" className="gap-1">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">매장</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">계정</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-1">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">알림</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-1">
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">메뉴</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">매출</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">메시지</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">시스템</span>
            </TabsTrigger>
          </TabsList>

          {/* Store Information Tab */}
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  매장 정보 관리
                </CardTitle>
                <CardDescription>매장의 기본 정보를 설정하고 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">매장명</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">전화번호</Label>
                    <Input
                      id="storePhone"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">이메일</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">주소</Label>
                  <div className="flex gap-2">
                    <Input
                      id="storeAddress"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" className="gap-2">
                      <MapPin className="w-4 h-4" />
                      지도 연동
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeDescription">매장 설명</Label>
                  <Textarea
                    id="storeDescription"
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="매장에 대한 간단한 설명을 입력하세요"
                    rows={3}
                  />
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">영업 시간 설정</h3>
                  {days.map((day) => (
                    <div key={day.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-16 text-sm font-medium">{day.label}</div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!businessHours[day.id].closed}
                          onCheckedChange={(checked) => 
                            handleBusinessHoursChange(day.id, 'closed', !checked)
                          }
                        />
                        <span className="text-sm">
                          {businessHours[day.id].closed ? "휴무" : "영업"}
                        </span>
                      </div>
                      {!businessHours[day.id].closed && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={businessHours[day.id].open}
                            onChange={(e) => 
                              handleBusinessHoursChange(day.id, 'open', e.target.value)
                            }
                            className="w-32"
                          />
                          <span>~</span>
                          <Input
                            type="time"
                            value={businessHours[day.id].close}
                            onChange={(e) => 
                              handleBusinessHoursChange(day.id, 'close', e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <Button onClick={handleSaveStoreInfo} className="w-full">
                  매장 정보 저장
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  계정 및 로그인 설정
                </CardTitle>
                <CardDescription>관리자 계정 정보와 로그인 방식을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">계정 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminName">관리자 이름</Label>
                      <Input
                        id="adminName"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">관리자 이메일</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">비밀번호 변경</h3>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">현재 비밀번호</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">새 비밀번호</Label>
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePasswordChange} variant="outline">
                    비밀번호 변경
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">로그인 기록</h3>
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">최근 로그인</div>
                    <div className="text-sm text-muted-foreground">2024년 1월 15일 오후 2:30</div>
                    <div className="text-sm text-muted-foreground">IP: 192.168.1.100</div>
                  </div>
                  <Button variant="destructive" className="w-full">
                    로그아웃
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR & Table Settings Tab */}
          <TabsContent value="qr" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      QR 및 테이블 관리
                    </CardTitle>
                    <CardDescription>등록된 테이블의 QR 코드를 관리합니다</CardDescription>
                  </div>
                  {tables.length > 0 && (
                    <Button 
                      onClick={() => {
                        // Download all QR codes as a zip file
                        toast({
                          title: "일괄 다운로드 완료",
                          description: `${tables.length}개 테이블의 QR 코드가 다운로드되었습니다.`,
                          className: "bg-green-50 text-green-800 border-green-200",
                        });
                      }}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      일괄 다운로드
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">등록된 테이블</h3>
                    <Badge variant="secondary">총 {tables.length}개 테이블</Badge>
                  </div>
                  
                  {tables.length === 0 ? (
                    <div className="text-center py-12">
                      <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">등록된 테이블이 없습니다</h3>
                      <p className="text-muted-foreground mb-4">
                        주문현황 페이지에서 테이블을 추가해보세요
                      </p>
                      <Button variant="outline">주문현황으로 이동</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {tables.map((table) => (
                        <Card key={table.id} className="p-3">
                          <div className="flex flex-col items-center space-y-2">
                            <h4 className="text-sm font-medium">T-{table.id.toString().padStart(2, '0')}</h4>
                            
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border border-dashed">
                              {qrLoading[table.id] ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                              ) : qrCodes[table.id] ? (
                                <img src={qrCodes[table.id]} alt={`QR for table ${table.id}`} className="w-full h-full object-contain" />
                              ) : (
                                <QrCode className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="w-full text-center">
                              <div className="text-xs font-mono bg-muted px-1 py-1 rounded truncate">
                                /table/{table.id}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1 w-full">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-6 gap-1"
                                onClick={() => generateQRCode(table.id, table.name)}
                                disabled={qrLoading[table.id]}
                              >
                                {qrLoading[table.id] ? (
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <Download className="w-3 h-3" />
                                )}
                                다운로드
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-6 gap-1"
                                onClick={() => handleReissueQR(table.id, table.name)}
                                disabled={qrLoading[table.id]}
                              >
                                {qrLoading[table.id] ? (
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <QrCode className="w-3 h-3" />
                                )}
                                재발급
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-6 gap-1"
                                onClick={() => window.open(table.url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                                페이지 열기
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-6 gap-1"
                                onClick={() => copyToClipboard(table.url)}
                              >
                                <Copy className="w-3 h-3" />
                                URL 복사
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">테이블 관리 안내</p>
                        <p className="text-muted-foreground mt-1">
                          테이블 추가/삭제는 <strong>주문현황</strong> 페이지에서 할 수 있습니다. 
                          이 페이지에서는 QR 코드 다운로드, 재발급, 변경만 가능합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  알림 및 리마인드 설정
                </CardTitle>
                <CardDescription>예약 리마인드와 알림 설정을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">예약 리마인드 알림</div>
                      <div className="text-sm text-muted-foreground">
                        고객에게 예약 리마인드 메시지를 자동으로 전송합니다
                      </div>
                    </div>
                    <Switch
                      checked={reservationReminder}
                      onCheckedChange={setReservationReminder}
                    />
                  </div>

                  {reservationReminder && (
                    <div className="ml-4 space-y-2">
                      <Label>리마인드 전송 시점</Label>
                      <Select value={reminderTiming} onValueChange={setReminderTiming}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1시간 전</SelectItem>
                          <SelectItem value="2">2시간 전</SelectItem>
                          <SelectItem value="3">3시간 전</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">조리완료 알림 사운드</div>
                      <div className="text-sm text-muted-foreground">
                        주문이 완료되면 알림 사운드를 재생합니다
                      </div>
                    </div>
                    <Switch
                      checked={cookingSound}
                      onCheckedChange={setCookingSound}
                    />
                  </div>

                  {cookingSound && (
                    <div className="ml-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          {cookingSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          사운드 테스트
                        </Button>
                        <span className="text-sm text-muted-foreground">알림 사운드 미리듣기</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Settings Tab */}
          <TabsContent value="menu" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="w-5 h-5" />
                  메뉴 관리 기본 설정
                </CardTitle>
                <CardDescription>메뉴 표시 방식과 기본 설정을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>추천 뱃지 기본값</Label>
                    <Select value={defaultBadge} onValueChange={setDefaultBadge}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">뱃지 없음</SelectItem>
                        <SelectItem value="recommended">사장님 추천</SelectItem>
                        <SelectItem value="best">베스트 메뉴</SelectItem>
                        <SelectItem value="new">신메뉴</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">품절 시 자동 숨김</div>
                      <div className="text-sm text-muted-foreground">
                        품절된 메뉴를 고객 화면에서 자동으로 숨김 처리합니다
                      </div>
                    </div>
                    <Switch
                      checked={autoHideSoldOut}
                      onCheckedChange={setAutoHideSoldOut}
                    />
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales & Data Tab */}
          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  매출 및 데이터 설정
                </CardTitle>
                <CardDescription>매출 데이터 관리와 리포트 설정을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">데이터 내보내기</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={handleDownloadCSV} className="gap-2">
                      <Download className="w-4 h-4" />
                      매출 데이터 CSV 다운로드
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <FileText className="w-4 h-4" />
                      상세 리포트 생성
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    최근 30일간의 주문 데이터를 CSV 형식으로 다운로드합니다.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">자동 리포트 설정</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">주간 매출 리포트</div>
                        <div className="text-sm text-muted-foreground">
                          매주 월요일에 이메일로 주간 매출 리포트를 받습니다
                        </div>
                      </div>
                      <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">월간 매출 리포트</div>
                        <div className="text-sm text-muted-foreground">
                          매월 1일에 이메일로 월간 매출 리포트를 받습니다
                        </div>
                      </div>
                      <Switch checked={monthlyReport} onCheckedChange={setMonthlyReport} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">방문 고객 수 추정</h3>
                  <div className="space-y-2">
                    <Label>추정 방식</Label>
                    <Select value={visitorTracking} onValueChange={setVisitorTracking}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estimated">주문 기반 추정</SelectItem>
                        <SelectItem value="manual">수동 입력</SelectItem>
                        <SelectItem value="qr">QR 스캔 기반</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  고객 메시지 커스터마이징
                </CardTitle>
                <CardDescription>고객에게 전송되는 메시지를 사용자 정의할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(customMessages).map(([type, message]) => {
                  const isCustom = useCustomMessage[type as keyof typeof useCustomMessage];
                  const templates = messageTemplates[type as keyof typeof messageTemplates];
                  
                  return (
                    <div key={type} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {type === 'orderComplete' && '주문 완료 메시지'}
                          {type === 'servingComplete' && '서빙 완료 메시지'}
                        </h3>
                        <Switch
                          checked={isCustom}
                          onCheckedChange={(checked) =>
                            setUseCustomMessage(prev => ({ ...prev, [type]: checked }))
                          }
                        />
                      </div>
                      
                      {!isCustom ? (
                        <div className="space-y-2">
                          <Label>템플릿 선택</Label>
                          <div className="space-y-2">
                            {templates.map((template, index) => (
                              <div
                                key={index}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  message === template ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                                }`}
                                onClick={() => handleMessageTemplateSelect(type as keyof typeof customMessages, template)}
                              >
                                <div className="text-sm">{template}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>사용자 정의 메시지</Label>
                          <Textarea
                            value={message}
                            onChange={(e) =>
                              setCustomMessages(prev => ({ ...prev, [type]: e.target.value }))
                            }
                            placeholder="고객에게 전송할 메시지를 입력하세요..."
                            rows={3}
                          />
                        </div>
                      )}
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">미리보기</div>
                        <div className="text-sm text-muted-foreground">{message}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  시스템 UI 설정
                </CardTitle>
                <CardDescription>앱의 외관과 시스템 설정을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">테마 설정</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          theme === 'light' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                        onClick={() => setTheme('light')}
                      >
                        <div className="flex items-center gap-3">
                          <Sun className="w-5 h-5" />
                          <div>
                            <div className="font-medium">라이트 모드</div>
                            <div className="text-sm text-muted-foreground">밝은 테마</div>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          theme === 'dark' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                        onClick={() => setTheme('dark')}
                      >
                        <div className="flex items-center gap-3">
                          <Moon className="w-5 h-5" />
                          <div>
                            <div className="font-medium">다크 모드</div>
                            <div className="text-sm text-muted-foreground">어두운 테마</div>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          theme === 'system' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                        onClick={() => setTheme('system')}
                      >
                        <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5" />
                          <div>
                            <div className="font-medium">시스템</div>
                            <div className="text-sm text-muted-foreground">시스템 설정 따름</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">언어 설정</h3>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5" />
                        <div>
                          <div className="font-medium">언어</div>
                          <div className="text-sm text-muted-foreground">
                            한국어 (기본)
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        변경
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    앱 정보
                  </h3>
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">앱 버전</span>
                      <Badge variant="outline">v2.1.0</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">마지막 업데이트</span>
                      <span className="text-sm text-muted-foreground">2024.01.15</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">업데이트 알림</span>
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        최신
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    업데이트 확인
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 