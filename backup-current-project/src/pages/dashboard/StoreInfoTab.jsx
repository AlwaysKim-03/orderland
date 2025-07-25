import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  User, 
  QrCode, 
  Bell, 
  Menu as MenuIcon, 
  BarChart3, 
  MessageSquare, 
  Settings,
  MapPin,
  Phone,
  Clock,
  Download,
  Upload,
  Eye,
  EyeOff,
  Key,
  LogOut,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { db, auth } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'sonner';
import { Separator } from "@/components/ui/separator";

// 설정 탭 데이터
const SETTINGS_TABS = [
  { id: 'store', label: '매장', icon: Store },
  { id: 'account', label: '계정', icon: User },
  { id: 'qr', label: 'QR', icon: QrCode },
  { id: 'notification', label: '알림', icon: Bell },
  { id: 'menu', label: '메뉴', icon: MenuIcon },
  { id: 'sales', label: '매출', icon: BarChart3 },
  { id: 'message', label: '메시지', icon: MessageSquare },
  { id: 'ui', label: 'UI', icon: Eye },
  { id: 'system', label: '시스템', icon: Settings },
];

// QR 크기 옵션
const QR_SIZES = [
  { id: 'small', label: '작은 크기 (200x200)', value: 200 },
  { id: 'medium', label: '중간 크기 (300x300)', value: 300 },
  { id: 'large', label: '큰 크기 (400x400)', value: 400 },
];

// 영업시간 요일
const BUSINESS_DAYS = [
  { id: 'monday', label: '월요일', short: '월' },
  { id: 'tuesday', label: '화요일', short: '화' },
  { id: 'wednesday', label: '수요일', short: '수' },
  { id: 'thursday', label: '목요일', short: '목' },
  { id: 'friday', label: '금요일', short: '금' },
  { id: 'saturday', label: '토요일', short: '토' },
  { id: 'sunday', label: '일요일', short: '일' },
];

// 메시지 템플릿
const MESSAGE_TEMPLATES = [
  { id: 'welcome', label: '환영 메시지', default: '오더랜드에 오신 것을 환영합니다! 🎉' },
  { id: 'order_received', label: '주문 접수', default: '주문이 성공적으로 접수되었습니다. 잠시만 기다려주세요! ⏰' },
  { id: 'order_ready', label: '주문 준비 완료', default: '주문하신 음식이 준비되었습니다! 테이블로 와서 받아가세요! 🍽️' },
  { id: 'order_completed', label: '주문 완료', default: '맛있게 드세요! 다음에도 이용해주세요! 😊' },
];

export default function StoreInfoTab({ userInfo, onStoreUpdate }) {
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(false);

  // 매장 정보 상태
  const [storeInfo, setStoreInfo] = useState({
    store_name: '',
    phone: '',
    address: '',
    tableCount: 1,
    businessHours: {
      monday: { open: true, start: '09:00', end: '22:00' },
      tuesday: { open: true, start: '09:00', end: '22:00' },
      wednesday: { open: true, start: '09:00', end: '22:00' },
      thursday: { open: true, start: '09:00', end: '22:00' },
      friday: { open: true, start: '09:00', end: '22:00' },
      saturday: { open: true, start: '10:00', end: '23:00' },
      sunday: { open: false, start: '10:00', end: '22:00' }
    }
  });

  // 계정 설정 상태
  const [accountSettings, setAccountSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    pushNotifications: true,
    autoLogout: false,
    sessionTimeout: 30
  });

  // QR 설정 상태
  const [qrSettings, setQrSettings] = useState({
    size: 'medium',
    includeLogo: true,
    showTableNumber: true,
    backgroundColor: '#FFFFFF',
    foregroundColor: '#000000'
  });

  // 알림 설정 상태
  const [notificationSettings, setNotificationSettings] = useState({
    newOrder: true,
    orderStatus: true,
    reservation: true,
    salesReport: false,
    soundEnabled: true,
    vibrationEnabled: true
  });

  // 메뉴 설정 상태
  const [menuSettings, setMenuSettings] = useState({
    showPrices: true,
    showDescriptions: true,
    showImages: true,
    categoryOrder: 'name',
    itemOrder: 'name',
    showSoldOut: true
  });

  // 매출 설정 상태
  const [salesSettings, setSalesSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    includeTax: true,
    taxRate: 10,
    currency: 'KRW',
    timezone: 'Asia/Seoul'
  });

  // UI 설정 상태
  const [uiSettings, setUiSettings] = useState({
    // 폰트 크기 설정
    fontSize: 'medium', // small, medium, large
    titleFontSize: 'large',
    bodyFontSize: 'medium',
    buttonFontSize: 'medium',
    
    // 테이블 스타일 설정
    tableFontSize: 'small',
    tableRowHeight: 'normal', // compact, normal, spacious
    tablePadding: 'normal', // compact, normal, spacious
    tableBorderStyle: 'solid', // solid, dashed, none
    
    // 컴포넌트 크기 설정
    buttonSize: 'medium', // small, medium, large
    iconSize: 'medium', // small, medium, large
    cardPadding: 'normal', // compact, normal, spacious
    
    // 색상 테마 설정
    primaryColor: '#f97316', // orange-500
    secondaryColor: '#6b7280', // gray-500
    accentColor: '#10b981', // emerald-500
    
    // 간격 설정
    spacing: 'normal', // compact, normal, spacious
    borderRadius: 'medium', // small, medium, large
  });

  // 메시지 설정 상태
  const [messageSettings, setMessageSettings] = useState({
    templates: MESSAGE_TEMPLATES.reduce((acc, template) => {
      acc[template.id] = template.default;
      return acc;
    }, {}),
    autoSend: false,
    customEmoji: true
  });

  // 시스템 설정 상태
  const [systemSettings, setSystemSettings] = useState({
    theme: 'light',
    language: 'ko',
    timeFormat: '24h',
    dateFormat: 'YYYY-MM-DD',
    debugMode: false,
    analytics: true
  });

  // 소셜 로그인 설정
  const [socialLogin, setSocialLogin] = useState({
    kakao: false,
    naver: false,
    google: true
  });

  // userInfo가 업데이트되면 상태 동기화
  useEffect(() => {
    if (userInfo) {
      setStoreInfo({
        store_name: userInfo.store_name || '',
        phone: userInfo.phone || '',
        address: userInfo.address || '',
        tableCount: userInfo.tableCount || 1,
        businessHours: userInfo.businessHours || storeInfo.businessHours
      });
    }
  }, [userInfo]);

  // 매장 정보 저장
  const handleSaveStoreInfo = async () => {
    if (!storeInfo.store_name.trim()) {
      toast.error('매장명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", userInfo.uid);
      await updateDoc(userDocRef, {
        store_name: storeInfo.store_name.trim(),
        phone: storeInfo.phone,
        address: storeInfo.address,
        tableCount: Number(storeInfo.tableCount),
        businessHours: storeInfo.businessHours
      });
      
      toast.success('매장 정보가 저장되었습니다.');
      if (onStoreUpdate) onStoreUpdate();
    } catch (error) {
      console.error('매장 정보 저장 실패:', error);
      toast.error('저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    if (!accountSettings.currentPassword || !accountSettings.newPassword) {
      toast.error('현재 비밀번호와 새 비밀번호를 입력해주세요.');
      return;
    }

    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, accountSettings.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, accountSettings.newPassword);
      
      toast.success('비밀번호가 변경되었습니다.');
      setAccountSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      toast.error('비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      toast.error('로그아웃에 실패했습니다.');
    }
  };

  // 영업시간 변경
  const handleBusinessHoursChange = (dayId, field, value) => {
    setStoreInfo(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [dayId]: {
          ...prev.businessHours[dayId],
          [field]: value
        }
      }
    }));
  };

  // QR 크기 변경
  const handleQrSizeChange = (size) => {
    setQrSettings(prev => ({ ...prev, size }));
    toast.success(`${QR_SIZES.find(s => s.id === size)?.label}로 설정되었습니다.`);
  };

  // 메시지 템플릿 변경
  const handleMessageTemplateChange = (templateId, value) => {
    setMessageSettings(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [templateId]: value
      }
    }));
  };

  // CSV 다운로드
  const handleCsvDownload = () => {
    toast.success('CSV 파일 다운로드가 시작됩니다.');
    // 실제 CSV 다운로드 로직 구현
  };

  return (
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">
          매장 운영에 필요한 모든 설정을 관리하세요
        </p>
      </div>

      {/* 설정 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* 매장 정보 탭 */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                매장 정보 관리
              </CardTitle>
              <CardDescription>
                매장의 기본 정보를 설정하고 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">매장명</Label>
                  <Input
                    id="storeName"
                    value={storeInfo.store_name}
                    onChange={(e) => setStoreInfo(prev => ({ ...prev, store_name: e.target.value }))}
                    placeholder="매장명을 입력하세요"
                    className="border-border focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                    id="phone"
                    value={storeInfo.phone}
                    onChange={(e) => setStoreInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="border-border focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="매장 주소를 입력하세요"
                    className="flex-1 border-border focus:ring-primary"
                  />
                  <Button variant="outline" className="gap-2">
                    <MapPin className="w-4 h-4" />
                    지도 연동
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tableCount">테이블 수</Label>
                <Input
                  id="tableCount"
                  type="number"
                  min="1"
                  value={storeInfo.tableCount}
                  onChange={(e) => setStoreInfo(prev => ({ ...prev, tableCount: parseInt(e.target.value) || 1 }))}
                  className="w-32 border-border focus:ring-primary"
                />
              </div>

              <Button onClick={handleSaveStoreInfo} className="w-full" disabled={loading}>
                {loading ? '저장 중...' : '매장 정보 저장'}
              </Button>
            </CardContent>
          </Card>

          {/* 영업시간 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                영업시간 설정
              </CardTitle>
              <CardDescription>
                요일별 영업시간을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {BUSINESS_DAYS.map((day) => (
                <div key={day.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-16 text-sm font-medium">{day.label}</div>
                  <Switch
                    checked={storeInfo.businessHours[day.id].open}
                    onCheckedChange={(checked) => 
                      handleBusinessHoursChange(day.id, 'open', checked)
                    }
                  />
                  <Input
                    type="time"
                    value={storeInfo.businessHours[day.id].start}
                    onChange={(e) => handleBusinessHoursChange(day.id, 'start', e.target.value)}
                    className="w-32"
                    disabled={!storeInfo.businessHours[day.id].open}
                  />
                  <span className="text-muted-foreground">~</span>
                  <Input
                    type="time"
                    value={storeInfo.businessHours[day.id].end}
                    onChange={(e) => handleBusinessHoursChange(day.id, 'end', e.target.value)}
                    className="w-32"
                    disabled={!storeInfo.businessHours[day.id].open}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 계정 탭 */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                계정 설정
              </CardTitle>
              <CardDescription>
                계정 정보와 보안 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={accountSettings.currentPassword}
                  onChange={(e) => setAccountSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="현재 비밀번호를 입력하세요"
                  className="border-border focus:ring-primary"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={accountSettings.newPassword}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="새 비밀번호를 입력하세요"
                    className="border-border focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={accountSettings.confirmPassword}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="border-border focus:ring-primary"
                  />
                </div>
              </div>

              <Button onClick={handlePasswordChange} className="w-full" disabled={loading}>
                {loading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </CardContent>
          </Card>

          {/* 소셜 로그인 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>소셜 로그인 설정</CardTitle>
              <CardDescription>
                소셜 계정으로 로그인할 수 있는 서비스를 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">K</span>
                  </div>
                  <span>카카오 로그인</span>
                </div>
                <Switch 
                  checked={socialLogin.kakao} 
                  onCheckedChange={(checked) => setSocialLogin(prev => ({ ...prev, kakao: checked }))} 
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <span>네이버 로그인</span>
                </div>
                <Switch 
                  checked={socialLogin.naver} 
                  onCheckedChange={(checked) => setSocialLogin(prev => ({ ...prev, naver: checked }))} 
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <span>구글 로그인</span>
                </div>
                <Switch 
                  checked={socialLogin.google} 
                  onCheckedChange={(checked) => setSocialLogin(prev => ({ ...prev, google: checked }))} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR 탭 */}
        <TabsContent value="qr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR 코드 설정
              </CardTitle>
              <CardDescription>
                테이블별 QR 코드의 크기와 스타일을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>QR 코드 크기</Label>
                <Select value={qrSettings.size} onValueChange={handleQrSizeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QR_SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>로고 포함</Label>
                  <Switch
                    checked={qrSettings.includeLogo}
                    onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, includeLogo: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>테이블 번호 표시</Label>
                  <Switch
                    checked={qrSettings.showTableNumber}
                    onCheckedChange={(checked) => setQrSettings(prev => ({ ...prev, showTableNumber: checked }))}
                  />
                </div>
              </div>

              <Button className="w-full gap-2">
                <Download className="w-4 h-4" />
                QR 코드 다운로드
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 탭 */}
        <TabsContent value="notification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                알림 설정
              </CardTitle>
              <CardDescription>
                다양한 알림을 설정하고 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>새 주문 알림</Label>
                  <Switch
                    checked={notificationSettings.newOrder}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, newOrder: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>주문 상태 변경 알림</Label>
                  <Switch
                    checked={notificationSettings.orderStatus}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, orderStatus: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>예약 알림</Label>
                  <Switch
                    checked={notificationSettings.reservation}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, reservation: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>매출 리포트 알림</Label>
                  <Switch
                    checked={notificationSettings.salesReport}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, salesReport: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>소리 알림</Label>
                  <Switch
                    checked={notificationSettings.soundEnabled}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>진동 알림</Label>
                  <Switch
                    checked={notificationSettings.vibrationEnabled}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, vibrationEnabled: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 메뉴 탭 */}
        <TabsContent value="menu" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MenuIcon className="w-5 h-5" />
                메뉴 표시 설정
              </CardTitle>
              <CardDescription>
                메뉴 화면의 표시 옵션을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>가격 표시</Label>
                  <Switch
                    checked={menuSettings.showPrices}
                    onCheckedChange={(checked) => setMenuSettings(prev => ({ ...prev, showPrices: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>설명 표시</Label>
                  <Switch
                    checked={menuSettings.showDescriptions}
                    onCheckedChange={(checked) => setMenuSettings(prev => ({ ...prev, showDescriptions: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>이미지 표시</Label>
                  <Switch
                    checked={menuSettings.showImages}
                    onCheckedChange={(checked) => setMenuSettings(prev => ({ ...prev, showImages: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>품절 메뉴 표시</Label>
                  <Switch
                    checked={menuSettings.showSoldOut}
                    onCheckedChange={(checked) => setMenuSettings(prev => ({ ...prev, showSoldOut: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 매출 탭 */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                매출 데이터 설정
              </CardTitle>
              <CardDescription>
                매출 데이터 관리 및 백업 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>자동 백업</Label>
                  <Switch
                    checked={salesSettings.autoBackup}
                    onCheckedChange={(checked) => setSalesSettings(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>세금 포함</Label>
                  <Switch
                    checked={salesSettings.includeTax}
                    onCheckedChange={(checked) => setSalesSettings(prev => ({ ...prev, includeTax: checked }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>세율 (%)</Label>
                  <Input
                    type="number"
                    value={salesSettings.taxRate}
                    onChange={(e) => setSalesSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    disabled={!salesSettings.includeTax}
                  />
                </div>
                <div className="space-y-2">
                  <Label>통화</Label>
                  <Select value={salesSettings.currency} onValueChange={(value) => setSalesSettings(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KRW">원 (₩)</SelectItem>
                      <SelectItem value="USD">달러 ($)</SelectItem>
                      <SelectItem value="EUR">유로 (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCsvDownload} className="w-full gap-2">
                <Download className="w-4 h-4" />
                매출 데이터 CSV 다운로드
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 메시지 탭 */}
        <TabsContent value="message" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                메시지 템플릿
              </CardTitle>
              <CardDescription>
                고객에게 표시되는 메시지를 커스터마이징합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MESSAGE_TEMPLATES.map((template) => (
                <div key={template.id} className="space-y-2">
                  <Label>{template.label}</Label>
                  <Textarea
                    value={messageSettings.templates[template.id]}
                    onChange={(e) => handleMessageTemplateChange(template.id, e.target.value)}
                    placeholder={template.default}
                    rows={3}
                  />
                </div>
              ))}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>자동 메시지 전송</Label>
                  <Switch
                    checked={messageSettings.autoSend}
                    onCheckedChange={(checked) => setMessageSettings(prev => ({ ...prev, autoSend: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>커스텀 이모지 사용</Label>
                  <Switch
                    checked={messageSettings.customEmoji}
                    onCheckedChange={(checked) => setMessageSettings(prev => ({ ...prev, customEmoji: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI 설정 탭 */}
        <TabsContent value="ui" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                UI 스타일 설정
              </CardTitle>
              <CardDescription>
                테이블 모양, 폰트 크기, 컴포넌트 스타일을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 폰트 크기 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">폰트 크기 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>전체 폰트 크기</Label>
                    <Select value={uiSettings.fontSize} onValueChange={(value) => setUiSettings(prev => ({ ...prev, fontSize: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">작게 (12px)</SelectItem>
                        <SelectItem value="medium">보통 (14px)</SelectItem>
                        <SelectItem value="large">크게 (16px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>제목 폰트 크기</Label>
                    <Select value={uiSettings.titleFontSize} onValueChange={(value) => setUiSettings(prev => ({ ...prev, titleFontSize: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">작게 (16px)</SelectItem>
                        <SelectItem value="medium">보통 (20px)</SelectItem>
                        <SelectItem value="large">크게 (24px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 테이블 스타일 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">테이블 스타일 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>테이블 폰트 크기</Label>
                    <Select value={uiSettings.tableFontSize} onValueChange={(value) => setUiSettings(prev => ({ ...prev, tableFontSize: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">작게 (12px)</SelectItem>
                        <SelectItem value="medium">보통 (14px)</SelectItem>
                        <SelectItem value="large">크게 (16px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>테이블 행 높이</Label>
                    <Select value={uiSettings.tableRowHeight} onValueChange={(value) => setUiSettings(prev => ({ ...prev, tableRowHeight: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">좁게</SelectItem>
                        <SelectItem value="normal">보통</SelectItem>
                        <SelectItem value="spacious">넓게</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>테이블 패딩</Label>
                    <Select value={uiSettings.tablePadding} onValueChange={(value) => setUiSettings(prev => ({ ...prev, tablePadding: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">좁게</SelectItem>
                        <SelectItem value="normal">보통</SelectItem>
                        <SelectItem value="spacious">넓게</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>테이블 테두리</Label>
                    <Select value={uiSettings.tableBorderStyle} onValueChange={(value) => setUiSettings(prev => ({ ...prev, tableBorderStyle: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">실선</SelectItem>
                        <SelectItem value="dashed">점선</SelectItem>
                        <SelectItem value="none">없음</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 컴포넌트 크기 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">컴포넌트 크기 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>버튼 크기</Label>
                    <Select value={uiSettings.buttonSize} onValueChange={(value) => setUiSettings(prev => ({ ...prev, buttonSize: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">작게</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="large">크게</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>아이콘 크기</Label>
                    <Select value={uiSettings.iconSize} onValueChange={(value) => setUiSettings(prev => ({ ...prev, iconSize: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">작게 (16px)</SelectItem>
                        <SelectItem value="medium">보통 (20px)</SelectItem>
                        <SelectItem value="large">크게 (24px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>카드 패딩</Label>
                    <Select value={uiSettings.cardPadding} onValueChange={(value) => setUiSettings(prev => ({ ...prev, cardPadding: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">좁게</SelectItem>
                        <SelectItem value="normal">보통</SelectItem>
                        <SelectItem value="spacious">넓게</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 색상 테마 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">색상 테마 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>주요 색상</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={uiSettings.primaryColor}
                        onChange={(e) => setUiSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-10 h-10 rounded border"
                      />
                      <Input
                        value={uiSettings.primaryColor}
                        onChange={(e) => setUiSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>보조 색상</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={uiSettings.secondaryColor}
                        onChange={(e) => setUiSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="w-10 h-10 rounded border"
                      />
                      <Input
                        value={uiSettings.secondaryColor}
                        onChange={(e) => setUiSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>강조 색상</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={uiSettings.accentColor}
                        onChange={(e) => setUiSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-10 h-10 rounded border"
                      />
                      <Input
                        value={uiSettings.accentColor}
                        onChange={(e) => setUiSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 간격 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">간격 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>전체 간격</Label>
                    <Select value={uiSettings.spacing} onValueChange={(value) => setUiSettings(prev => ({ ...prev, spacing: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">좁게</SelectItem>
                        <SelectItem value="normal">보통</SelectItem>
                        <SelectItem value="spacious">넓게</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>모서리 둥글기</Label>
                    <Select value={uiSettings.borderRadius} onValueChange={(value) => setUiSettings(prev => ({ ...prev, borderRadius: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">작게 (4px)</SelectItem>
                        <SelectItem value="medium">보통 (8px)</SelectItem>
                        <SelectItem value="large">크게 (12px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={() => toast.success('UI 설정이 저장되었습니다.')} className="w-full">
                UI 설정 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 탭 */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                시스템 설정
              </CardTitle>
              <CardDescription>
                시스템 전반의 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>테마</Label>
                  <Select value={systemSettings.theme} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, theme: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">라이트</SelectItem>
                      <SelectItem value="dark">다크</SelectItem>
                      <SelectItem value="auto">자동</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>언어</Label>
                  <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>디버그 모드</Label>
                  <Switch
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, debugMode: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>분석 데이터 수집</Label>
                  <Switch
                    checked={systemSettings.analytics}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, analytics: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 