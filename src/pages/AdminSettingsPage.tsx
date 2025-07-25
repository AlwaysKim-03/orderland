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
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
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
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Play,
  CalendarIcon
} from "lucide-react";
import { collection, doc, getDoc, setDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { soundNotification, testCookingSound } from "../utils/soundNotification";
import { reservationReminder as reservationReminderUtil, requestNotificationPermission } from "../utils/reservationReminder";
import { downloadOrdersCSV, downloadSalesCSV, downloadCombinedCSV, getDateRangeOptions } from "../utils/csvExport";
import { generateWeeklyReport, generateMonthlyReport, generateReportHTML, sendReportEmail } from "../utils/salesReport";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { kakaoLogin, naverLogin, checkSocialLoginStatus, socialLogout } from "../utils/socialLogin";

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
  reservationConfirmed: [
    "예약이 확정되었습니다. 방문을 기다리겠습니다! 🎉",
    "예약해주셔서 감사합니다. 좋은 시간 되세요!",
    "예약 완료! 특별한 순간을 함께하겠습니다.",
  ],
  servingComplete: [
    "주문하신 음식이 준비되었습니다. 맛있게 드세요! 🍽️",
    "따끈따끈한 요리가 나왔어요! 즐거운 식사시간 되세요.",
    "음식 준비 완료! 최고의 맛을 경험해보세요.",
  ],
};

// Translation data
const translations = {
  ko: {
    // Page titles
    settings: "설정",
    settingsDescription: "매장 운영에 필요한 모든 설정을 관리하세요",
    
    // Tab names
    store: "매장",
    account: "계정", 
    qr: "QR",
    notifications: "알림",
    menu: "메뉴",
    sales: "매출",
    messages: "메시지",
    system: "시스템",
    
    // Store settings
    storeInfo: "매장 정보 관리",
    storeInfoDesc: "매장의 기본 정보를 설정하고 관리합니다",
    storeName: "매장명",
    phone: "전화번호",
    address: "매장 주소",
    addressPlaceholder: "예: 서울시 강남구 테헤란로 123",
    mapIntegration: "지도 연동",
    addressHelp: "정확한 주소를 입력하면 고객이 찾기 쉬워집니다",
    orderSiteUrl: "주문사이트 URL",
    orderSitePlaceholder: "https://your-store.com",
    openSite: "사이트 열기",
    urlHelp: "QR 코드에 사용될 주문사이트 주소입니다",
    businessHours: "영업 시간 설정",
    setDefault: "기본값으로 설정",
    saveStoreInfo: "매장 정보 저장",
    
    // Days
    monday: "월요일",
    tuesday: "화요일", 
    wednesday: "수요일",
    thursday: "목요일",
    friday: "금요일",
    saturday: "토요일",
    sunday: "일요일",
    open: "오픈",
    close: "마감",
    closed: "휴무",
    openStatus: "영업",
    businessHoursPreview: "영업시간 미리보기",
    
    // Account settings
    accountSettings: "계정 및 로그인 설정",
    accountSettingsDesc: "관리자 계정 정보와 로그인 방식을 관리합니다",
    accountInfo: "계정 정보",
    adminEmail: "관리자 이메일",
    emailHelp: "이메일은 회원가입 시 등록한 계정으로 자동 연동됩니다",
    passwordChange: "비밀번호 변경",
    currentPassword: "현재 비밀번호",
    newPassword: "새 비밀번호",
    confirmPassword: "비밀번호 확인",
    changePassword: "비밀번호 변경",
    socialLogin: "소셜 로그인 연동",
    kakaoLogin: "카카오 로그인",
    naverLogin: "네이버 로그인",
    loginHistory: "로그인 기록",
    recentLogin: "최근 로그인",
    logout: "로그아웃",
    
    // QR settings
    qrTableManagement: "QR 및 테이블 관리",
    qrTableManagementDesc: "등록된 테이블의 QR 코드를 관리합니다",
    registeredTables: "등록된 테이블",
    totalTables: "총 {count}개 테이블",
    noTables: "등록된 테이블이 없습니다",
    noTablesDesc: "주문현황 페이지에서 테이블을 추가해보세요",
    goToOrders: "주문현황으로 이동",
    batchDownload: "일괄 다운로드",
    download: "다운로드",
    reissue: "재발급",
    openSiteButton: "사이트 열기",
    tableManagementGuide: "테이블 관리 안내",
    tableManagementDesc: "테이블 추가/삭제는 주문현황 페이지에서 할 수 있습니다. 이 페이지에서는 QR 코드 다운로드, 재발급, 변경만 가능합니다.",
    
    // Notifications
    notificationsSettings: "알림 및 리마인드 설정",
    notificationsSettingsDesc: "예약 리마인드와 알림 설정을 관리합니다",
    reservationReminder: "예약 리마인드 알림",
    reservationReminderDesc: "고객에게 예약 리마인드 메시지를 자동으로 전송합니다",
    reminderTiming: "리마인드 전송 시점",
    oneHourBefore: "1시간 전",
    twoHoursBefore: "2시간 전", 
    threeHoursBefore: "3시간 전",
    cookingSound: "조리완료 알림 사운드",
    cookingSoundDesc: "주문이 완료되면 알림 사운드를 재생합니다",
    soundTest: "사운드 테스트",
    soundPreview: "알림 사운드 미리듣기",
    
    // Menu settings
    menuSettings: "메뉴 관리 기본 설정",
    menuSettingsDesc: "메뉴 표시 방식과 기본 설정을 관리합니다",
    defaultBadge: "기본 뱃지",
    noBadge: "뱃지 없음",
    recommended: "사장님 추천",
    bestMenu: "베스트 메뉴",
    newMenu: "신메뉴",
    autoHideSoldOut: "품절 시 자동 숨김",
    autoHideSoldOutDesc: "품절된 메뉴를 고객 화면에서 자동으로 숨김 처리합니다",
    defaultIconSet: "메뉴 아이콘 기본 세트",
    modernStyle: "모던 스타일",
    classicStyle: "클래식 스타일",
    minimalStyle: "미니멀 스타일",
    colorfulStyle: "컬러풀 스타일",
    
    // Sales settings
    salesSettings: "매출 및 데이터 설정",
    salesSettingsDesc: "매출 데이터 관리와 리포트 설정을 관리합니다",
    dataExport: "데이터 내보내기",
    downloadSalesData: "매출 데이터 CSV 다운로드",
    autoReportSettings: "자동 리포트 설정",
    weeklyReport: "주간 매출 리포트",
    weeklyReportDesc: "매주 월요일에 이메일로 주간 매출 리포트를 받습니다",
    monthlyReport: "월간 매출 리포트", 
    monthlyReportDesc: "매월 1일에 이메일로 월간 매출 리포트를 받습니다",
    visitorTracking: "방문 고객 수 추정",
    trackingMethod: "추정 방식",
    orderBased: "주문 기반 추정",
    manualInput: "수동 입력",
    qrBased: "QR 스캔 기반",
    
    // Messages
    customerMessages: "고객 메시지 커스터마이징",
    customerMessagesDesc: "고객에게 전송되는 메시지를 사용자 정의할 수 있습니다",
    orderCompleteMessage: "주문 완료 메시지",
    reservationConfirmedMessage: "예약 확정 메시지",
    servingCompleteMessage: "서빙 완료 메시지",
    templateSelection: "템플릿 선택",
    customMessage: "사용자 정의 메시지",
    customMessagePlaceholder: "고객에게 전송할 메시지를 입력하세요...",
    preview: "미리보기",
    
    // System settings
    systemSettings: "시스템 UI 설정",
    systemSettingsDesc: "앱의 외관과 시스템 설정을 관리합니다",
    darkMode: "다크모드",
    darkModeDesc: "어두운 테마로 전환합니다",
    languageSettings: "언어 설정",
    appInfo: "앱 정보",
    appVersion: "앱 버전",
    lastUpdate: "마지막 업데이트",
    updateNotification: "업데이트 알림",
    latest: "최신",
    checkUpdate: "업데이트 확인",
    
    // Toast messages
    darkModeEnabled: "다크모드 활성화",
    darkModeDisabled: "라이트모드 활성화",
    darkModeEnabledDesc: "어두운 테마가 적용되었습니다.",
    darkModeDisabledDesc: "밝은 테마가 적용되었습니다.",
    languageChanged: "언어 설정 변경",
    languageChangedKo: "한국어로 설정되었습니다.",
    languageChangedEn: "English로 설정되었습니다.",
    settingSaveError: "설정 저장 실패",
    settingSaveErrorDesc: "설정 저장 중 오류가 발생했습니다.",
    defaultSetComplete: "기본값 설정 완료",
    defaultSetCompleteDesc: "영업시간이 기본값으로 설정되었습니다.",
    qrReissueComplete: "QR 코드 재발급",
    qrReissueCompleteDesc: "{tableName}의 QR 코드가 새로운 스타일로 재발급되었습니다.",
    batchDownloadComplete: "일괄 다운로드 완료",
    batchDownloadCompleteDesc: "{count}개의 QR 코드가 다운로드되었습니다.",
    downloadError: "다운로드 오류",
    downloadErrorDesc: "일괄 다운로드 중 오류가 발생했습니다.",
  },
  
  en: {
    // Page titles
    settings: "Settings",
    settingsDescription: "Manage all settings needed for store operation",
    
    // Tab names
    store: "Store",
    account: "Account",
    qr: "QR",
    notifications: "Notifications",
    menu: "Menu",
    sales: "Sales",
    messages: "Messages", 
    system: "System",
    
    // Store settings
    storeInfo: "Store Information Management",
    storeInfoDesc: "Set and manage basic store information",
    storeName: "Store Name",
    phone: "Phone Number",
    address: "Store Address",
    addressPlaceholder: "e.g., 123 Test Street, Seoul",
    mapIntegration: "Map Integration",
    addressHelp: "Enter accurate address to help customers find you easily",
    orderSiteUrl: "Order Site URL",
    orderSitePlaceholder: "https://your-store.com",
    openSite: "Open Site",
    urlHelp: "This is the order site address used in QR codes",
    businessHours: "Business Hours Settings",
    setDefault: "Set to Default",
    saveStoreInfo: "Save Store Information",
    
    // Days
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday", 
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    open: "Open",
    close: "Close",
    closed: "Closed",
    openStatus: "Open",
    businessHoursPreview: "Business Hours Preview",
    
    // Account settings
    accountSettings: "Account and Login Settings",
    accountSettingsDesc: "Manage administrator account information and login methods",
    accountInfo: "Account Information",
    adminEmail: "Admin Email",
    emailHelp: "Email is automatically linked to the account registered during signup",
    passwordChange: "Password Change",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    changePassword: "Change Password",
    socialLogin: "Social Login Integration",
    kakaoLogin: "Kakao Login",
    naverLogin: "Naver Login",
    loginHistory: "Login History",
    recentLogin: "Recent Login",
    logout: "Logout",
    
    // QR settings
    qrTableManagement: "QR and Table Management",
    qrTableManagementDesc: "Manage QR codes for registered tables",
    registeredTables: "Registered Tables",
    totalTables: "Total {count} Tables",
    noTables: "No registered tables",
    noTablesDesc: "Add tables from the orders page",
    goToOrders: "Go to Orders",
    batchDownload: "Batch Download",
    download: "Download",
    reissue: "Reissue",
    tableManagementGuide: "Table Management Guide",
    tableManagementDesc: "Table addition/deletion can be done on the orders page. This page only allows QR code download, reissue, and modification.",
    
    // Notifications
    notificationsSettings: "Notification and Reminder Settings",
    notificationsSettingsDesc: "Manage reservation reminders and notification settings",
    reservationReminder: "Reservation Reminder Notifications",
    reservationReminderDesc: "Automatically send reservation reminder messages to customers",
    reminderTiming: "Reminder Send Time",
    oneHourBefore: "1 hour before",
    twoHoursBefore: "2 hours before",
    threeHoursBefore: "3 hours before",
    cookingSound: "Cooking Complete Sound Notifications",
    cookingSoundDesc: "Play notification sound when order is completed",
    soundTest: "Sound Test",
    soundPreview: "Preview notification sound",
    
    // Menu settings
    menuSettings: "Menu Management Default Settings",
    menuSettingsDesc: "Manage menu display methods and default settings",
    defaultBadge: "Default Badge",
    noBadge: "No Badge",
    recommended: "Recommended",
    bestMenu: "Best Menu",
    newMenu: "New Menu",
    autoHideSoldOut: "Auto-hide when sold out",
    autoHideSoldOutDesc: "Automatically hide sold-out menus from customer view",
    defaultIconSet: "Default Menu Icon Set",
    modernStyle: "Modern Style",
    classicStyle: "Classic Style",
    minimalStyle: "Minimal Style",
    colorfulStyle: "Colorful Style",
    
    // Sales settings
    salesSettings: "Sales and Data Settings",
    salesSettingsDesc: "Manage sales data and report settings",
    dataExport: "Data Export",
    downloadSalesData: "Download Sales Data CSV",
    autoReportSettings: "Auto Report Settings",
    weeklyReport: "Weekly Sales Report",
    weeklyReportDesc: "Receive weekly sales report via email every Monday",
    monthlyReport: "Monthly Sales Report",
    monthlyReportDesc: "Receive monthly sales report via email on the 1st of each month",
    visitorTracking: "Visitor Count Estimation",
    trackingMethod: "Estimation Method",
    orderBased: "Order-based estimation",
    manualInput: "Manual input",
    qrBased: "QR scan-based",
    
    // Messages
    customerMessages: "Customer Message Customization",
    customerMessagesDesc: "Customize messages sent to customers",
    orderCompleteMessage: "Order Complete Message",
    reservationConfirmedMessage: "Reservation Confirmed Message",
    servingCompleteMessage: "Serving Complete Message",
    templateSelection: "Template Selection",
    customMessage: "Custom Message",
    customMessagePlaceholder: "Enter message to send to customers...",
    preview: "Preview",
    
    // System settings
    systemSettings: "System UI Settings",
    systemSettingsDesc: "Manage app appearance and system settings",
    darkMode: "Dark Mode",
    darkModeDesc: "Switch to dark theme",
    languageSettings: "Language Settings",
    appInfo: "App Information",
    appVersion: "App Version",
    lastUpdate: "Last Update",
    updateNotification: "Update Notification",
    latest: "Latest",
    checkUpdate: "Check for Updates",
    
    // Toast messages
    darkModeEnabled: "Dark Mode Enabled",
    darkModeDisabled: "Light Mode Enabled",
    darkModeEnabledDesc: "Dark theme has been applied.",
    darkModeDisabledDesc: "Light theme has been applied.",
    languageChanged: "Language Setting Changed",
    languageChangedKo: "Set to Korean.",
    languageChangedEn: "Set to English.",
    settingSaveError: "Setting Save Failed",
    settingSaveErrorDesc: "An error occurred while saving settings.",
    defaultSetComplete: "Default Setting Complete",
    defaultSetCompleteDesc: "Business hours have been set to default.",
    qrReissueComplete: "QR Code Reissued",
    qrReissueCompleteDesc: "{tableName}'s QR code has been reissued with a new style.",
    batchDownloadComplete: "Batch Download Complete",
    batchDownloadCompleteDesc: "{count} QR codes have been downloaded.",
    downloadError: "Download Error",
    downloadErrorDesc: "An error occurred during batch download.",
  }
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("store");
  
  // Translation function
  const t = (key: string, params?: Record<string, string | number>) => {
    const translation = translations[language as keyof typeof translations]?.[key as keyof typeof translations.ko] || key;
    if (params) {
      return Object.entries(params).reduce((str, [param, value]) => {
        return str.replace(`{${param}}`, String(value));
      }, translation);
    }
    return translation;
  };
  
  // Store Info State
  const [storeName, setStoreName] = useState("오더랜드");
  const [storeAddress, setStoreAddress] = useState("서울시 강남구 테헤란로 123");
  const [storePhone, setStorePhone] = useState("02-1234-5678");
  const [orderSiteUrl, setOrderSiteUrl] = useState("http://localhost:8080/order/오더랜드/table-1");
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    monday: { open: "09:00", close: "22:00", closed: false },
    tuesday: { open: "09:00", close: "22:00", closed: false },
    wednesday: { open: "09:00", close: "22:00", closed: false },
    thursday: { open: "09:00", close: "22:00", closed: false },
    friday: { open: "09:00", close: "22:00", closed: false },
    saturday: { open: "10:00", close: "23:00", closed: false },
    sunday: { open: "10:00", close: "22:00", closed: false },
  });

  // Account Settings State
  const [adminEmail, setAdminEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [kakaoLogin, setKakaoLogin] = useState(true);
  const [naverLogin, setNaverLogin] = useState(false);

  // Additional notification settings
  const [reservationReminder, setReservationReminder] = useState(true);
  const [reminderTiming, setReminderTiming] = useState("2");
  const [cookingSound, setCookingSound] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [soundType, setSoundType] = useState<'default' | 'bell' | 'chime' | 'notification'>('default');
  const [reminderTypes, setReminderTypes] = useState({
    before30min: true,
    before1hour: true,
    before2hours: false
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // QR Settings State
  const [qrSettings, setQrSettings] = useState({
    size: "medium",
    includeLogo: true,
    autoGenerate: true,
  });

  // Menu Settings State
  const [defaultBadge, setDefaultBadge] = useState("none");
  const [autoHideSoldOut, setAutoHideSoldOut] = useState(true);
  const [defaultIconSet, setDefaultIconSet] = useState("modern");

  // Sales Settings State
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(false);
  const [visitorTracking, setVisitorTracking] = useState("estimated");

  // Message Settings State
  const [useCustomMessage, setUseCustomMessage] = useState({
    orderComplete: false,
    reservationConfirmed: false,
    servingComplete: false,
  });

  // System Settings State
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("ko");

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
          url: table.qrUrl || `https://orderland.kr/donkatsu/table/${table.id.toString().padStart(2, '0')}`,
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

  // Load settings from Firebase on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, "settings", "store");
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          
          // Store info
          if (data.storeName) setStoreName(data.storeName);
          if (data.storeAddress) setStoreAddress(data.storeAddress);
          if (data.storePhone) setStorePhone(data.storePhone);
          if (data.orderSiteUrl) setOrderSiteUrl(data.orderSiteUrl);
          
          // Business hours
          if (data.businessHours) {
            setBusinessHours(data.businessHours);
          }
          
          // Other settings
          if (data.notifications) {
            setReservationReminder(data.notifications.reservationReminder ?? true);
            setReminderTiming(data.notifications.reminderTiming ?? "2");
            setCookingSound(data.notifications.cookingSound ?? true);
          }
          
          if (data.qrSettings) setQrSettings(data.qrSettings);
          if (data.customMessages) setCustomMessages(data.customMessages);
          if (data.darkMode) setDarkMode(data.darkMode);
          if (data.language) setLanguage(data.language);
          
          // 사운드 설정 로드
          const soundSettings = soundNotification.getSettings();
          setSoundVolume(soundSettings.volume);
          setSoundType(soundSettings.soundType);
          
          console.log("설정이 Firebase에서 로드되었습니다:", data);
        }
      } catch (error) {
        console.error("설정 로드 오류:", error);
      }
    };

    loadSettings();
  }, []);

  // 주문 데이터 로드
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 주문 데이터 실시간 구독
        const ordersQuery = query(
          collection(db, "orders"),
          orderBy("createdAt", "desc")
        );

        const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(ordersData);
        }, (error) => {
          console.error('주문 데이터 로드 오류:', error);
        });

        return () => unsubscribeOrders();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderUpdates: true,
    reservations: true,
    salesAlerts: true,
    systemUpdates: false,
  });

  // Message Templates State
  const [customMessages, setCustomMessages] = useState({
    orderComplete: messageTemplates.orderComplete[0],
    reservationConfirmed: messageTemplates.reservationConfirmed[0],
    servingComplete: messageTemplates.servingComplete[0],
  });

  // Firebase에서 설정 데이터 가져오기
  useEffect(() => {
    let userPhoneNumber = ""; // 사용자 정보에서 가져온 전화번호 저장용
    let userStoreName = ""; // 사용자 정보에서 가져온 매장명 저장용
    
    // 현재 로그인한 사용자 정보 가져오기
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("현재 로그인한 사용자:", user.email);
        setAdminEmail(user.email || "");
        
        // Firestore에서 사용자 정보 가져오기
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("사용자 정보:", userData);
            
            // 사용자 정보에서 전화번호 가져오기 (Firebase Auth의 phoneNumber 또는 사용자 정의 필드)
            if (user.phoneNumber) {
              userPhoneNumber = user.phoneNumber;
              setStorePhone(user.phoneNumber);
            } else if (userData.phoneNumber) {
              userPhoneNumber = userData.phoneNumber;
              setStorePhone(userData.phoneNumber);
            }
            
            // 매장명도 사용자 정보에서 가져오기
            if (userData.storeName) {
              userStoreName = userData.storeName;
              setStoreName(userData.storeName);
            }
          }
        } catch (error) {
          console.error("사용자 정보 가져오기 오류:", error);
        }
      } else {
        console.log("로그인된 사용자가 없습니다.");
        setAdminEmail("");
      }
    });

    const settingsRef = doc(db, "settings", "store");
    
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log("Firebase에서 로드된 설정 데이터:", data); // 디버깅용
        
        // 매장명 우선순위: 사용자 정보 > 설정 데이터 > 기본값
        if (userStoreName) {
          setStoreName(userStoreName);
        } else {
        setStoreName(data.storeName || "오더랜드");
        }
        
        setStoreAddress(data.storeAddress || "서울시 강남구 테헤란로 123");
        
        // 전화번호 우선순위: 사용자 정보 > 설정 데이터 > 기본값
        if (userPhoneNumber) {
          setStorePhone(userPhoneNumber);
        } else {
          setStorePhone(data.storePhone || "02-1234-5678");
        }
        
        // 주문사이트 URL은 현재 매장명을 사용하여 생성
        const currentStoreName = userStoreName || data.storeName || "오더랜드";
        setOrderSiteUrl(data.orderSiteUrl || `http://localhost:8080/order/${currentStoreName}/table-1`);
        
        setBusinessHours(data.businessHours || businessHours);
        setNotifications(data.notifications || notifications);
        setQrSettings(data.qrSettings || qrSettings);
        setCustomMessages(data.customMessages || customMessages);
        setDarkMode(data.darkMode ?? false);
        setLanguage(data.language ?? "ko");
      } else {
        console.log("Firebase에 설정 데이터가 없습니다. 기본값을 사용합니다.");
      }
    }, (error) => {
      console.error("Firebase 설정 데이터 로드 오류:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  // 매장명이 변경될 때 주문사이트 URL 자동 업데이트
  useEffect(() => {
    const newUrl = `http://localhost:8080/order/${storeName}/table-1`;
    setOrderSiteUrl(newUrl);
  }, [storeName]);

  // Apply dark mode to document when component loads or darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSaveStoreInfo = async () => {
    try {
      const settingsRef = doc(db, "settings", "store");
      const settingsData = {
        storeName,
        storeAddress,
        storePhone,
        orderSiteUrl,
        businessHours,
        notifications,
        qrSettings,
        customMessages,
        darkMode,
        language,
        updatedAt: new Date()
      };
      
      console.log("Firebase에 저장할 설정 데이터:", settingsData); // 디버깅용
      
      await setDoc(settingsRef, settingsData, { merge: true });
      
      toast({
        title: "저장 완료",
        description: "스토어 정보가 저장되었습니다.",
      });
    } catch (error) {
      console.error("설정 저장 오류:", error);
      toast({
        title: "오류 발생",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
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

    try {
      // Firebase Auth를 사용한 비밀번호 변경
      // 실제 구현에서는 Firebase Auth의 updatePassword 사용
      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 변경되었습니다.",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Firebase Auth 로그아웃
      await signOut(auth);
      
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
      });
      
      // 홈페이지로 리다이렉트
      navigate("/");
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQR = async () => {
    try {
      // 테이블 수에 따라 여러 개의 QR 코드 생성
      const qrCodes = [];
      
      for (let i = 1; i <= tables.length; i++) {
        // 실제 URL로 변경 - 배포 시에는 실제 도메인으로 교체
        const baseUrl = window.location.origin; // 현재 실행 중인 도메인 사용
        const tableUrl = `${baseUrl}/order/${storeName || 'store'}/table-${i}`;
        
        // 외부 QR API 사용 (blob URL 대신)
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${selectedQrSize === "small" ? "100x100" : selectedQrSize === "medium" ? "150x150" : "200x200"}&data=${encodeURIComponent(tableUrl)}&margin=2&format=png`;
        
        qrCodes.push({
          tableNumber: i,
          url: tableUrl,
          qrImageUrl: qrImageUrl
        });
      }

      // QR 코드들을 새 창에서 열기
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>QR Codes - ${storeName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .qr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
                .qr-item { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                .qr-item img { max-width: 100%; height: auto; }
                .qr-item h3 { margin: 10px 0; color: #333; }
                .qr-item p { margin: 5px 0; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <h1>${storeName} - QR Codes</h1>
              <div class="qr-grid">
                ${qrCodes.map(qr => `
                  <div class="qr-item">
                    <img src="${qr.qrImageUrl}" alt="QR Code for Table ${qr.tableNumber}" />
                    <h3>테이블 ${qr.tableNumber}</h3>
                    <p>${qr.url}</p>
                  </div>
                `).join('')}
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }

      toast({
        title: "QR 코드 생성 완료",
        description: `${tables.length}개의 테이블 QR 코드가 새 창에서 열렸습니다. 인쇄하거나 저장하세요.`,
      });
    } catch (error) {
      console.error("QR 코드 생성 오류:", error);
      toast({
        title: "QR 코드 생성 실패",
        description: "QR 코드 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadCSV = () => {
    toast({
      title: "CSV 다운로드",
      description: "CSV 파일이 다운로드되었습니다.",
    });
  };

  const handleBusinessHoursChange = async (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const updatedHours = {
      ...businessHours,
      [day]: {
        ...businessHours[day],
        [field]: value
      }
    };
    
    setBusinessHours(updatedHours);
    
    // Firebase에 즉시 저장
    try {
      const settingsRef = doc(db, "settings", "store");
      await setDoc(settingsRef, {
        businessHours: updatedHours,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log("영업시간 설정이 Firebase에 저장되었습니다:", updatedHours);
    } catch (error) {
      console.error("영업시간 저장 오류:", error);
      toast({
        title: "저장 실패",
        description: "영업시간 설정 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleMessageTemplateSelect = (type: keyof typeof customMessages, template: string) => {
    setCustomMessages(prev => ({
      ...prev,
      [type]: template
    }));
  };

  const handleDownloadQR = (tableId: number, tableName: string) => {
    const baseUrl = window.location.origin;
    const tableUrl = `${baseUrl}/order/${storeName || 'store'}/table-${tableId}`;
    
    // QR 코드 이미지 URL 생성
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tableUrl)}`;
    
    // 이미지를 다운로드
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${tableName}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR 코드 다운로드",
      description: `${tableName}의 QR 코드가 다운로드되었습니다.`,
    });
  };

  const handleReissueQR = (tableId: number, tableName: string) => {
    const baseUrl = window.location.origin;
    const tableUrl = `${baseUrl}/order/${storeName || 'store'}/table-${tableId}`;

    // 재발급 시 다른 스타일의 QR 코드 생성 (크기, 마진, ECC 레벨만 변경, 색상은 유지)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(tableUrl)}&margin=5&format=png&ecc=H`;

    // 이미지를 다운로드
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${tableName}-QR-New.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR 코드 재발급",
      description: `${tableName}의 QR 코드가 새로운 스타일로 재발급되었습니다.`,
    });
  };

  const handleBatchDownloadQR = async () => {
    try {
      for (const table of tables) {
        const baseUrl = window.location.origin;
        const tableUrl = `${baseUrl}/order/${storeName || 'store'}/table-${table.id}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tableUrl)}`;
        
        const link = document.createElement('a');
        link.href = qrImageUrl;
        link.download = `${table.name}-QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 브라우저가 순차적으로 다운로드할 수 있도록 약간의 지연
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({
        title: "일괄 다운로드 완료",
        description: `${tables.length}개의 QR 코드가 다운로드되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "다운로드 오류",
        description: "일괄 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleUrlClick = (tableId: number) => {
    const baseUrl = window.location.origin;
    const tableUrl = `${baseUrl}/order/${storeName || 'store'}/table-${tableId}`;
    window.open(tableUrl, '_blank');
  };

  // Dark mode and language handlers
  const handleDarkModeChange = async (checked: boolean) => {
    setDarkMode(checked);
    
    // Apply dark mode to document
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to Firebase
    try {
      const settingsRef = doc(db, "settings", "store");
      await setDoc(settingsRef, {
        darkMode: checked,
        updatedAt: new Date()
      }, { merge: true });
      
      toast({
        title: checked ? t('darkModeEnabled') : t('darkModeDisabled'),
        description: checked ? t('darkModeEnabledDesc') : t('darkModeDisabledDesc'),
      });
    } catch (error) {
      console.error("다크모드 설정 저장 오류:", error);
      toast({
        title: t('settingSaveError'),
        description: t('settingSaveErrorDesc'),
        variant: "destructive",
      });
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    try {
      await setDoc(doc(db, "settings", "store"), {
        language: newLanguage
      }, { merge: true });
      toast({
        title: "언어 설정이 저장되었습니다",
        description: "페이지를 새로고침하면 변경사항이 적용됩니다.",
      });
    } catch (error) {
      console.error("언어 설정 저장 오류:", error);
      toast({
        title: "언어 설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 사운드 관련 핸들러 함수들
  const handleCookingSoundChange = async (enabled: boolean) => {
    setCookingSound(enabled);
    soundNotification.setEnabled(enabled);
    
    try {
      await setDoc(doc(db, "settings", "store"), {
        notifications: {
          cookingSound: enabled
        }
      }, { merge: true });
      
      toast({
        title: enabled ? "조리완료 알림 사운드가 활성화되었습니다" : "조리완료 알림 사운드가 비활성화되었습니다",
        description: enabled ? "주문이 완료되면 알림음이 재생됩니다." : "알림음이 재생되지 않습니다.",
      });
    } catch (error) {
      console.error("사운드 설정 저장 오류:", error);
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSoundVolumeChange = (volume: number[]) => {
    const newVolume = volume[0];
    setSoundVolume(newVolume);
    soundNotification.setVolume(newVolume);
  };

  const handleSoundTypeChange = (type: 'default' | 'bell' | 'chime' | 'notification') => {
    setSoundType(type);
    soundNotification.setSoundType(type);
  };

  const handleTestSound = async () => {
    try {
      await testCookingSound();
      toast({
        title: "사운드 테스트",
        description: "조리완료 알림음을 재생했습니다.",
      });
    } catch (error) {
      console.error("사운드 테스트 실패:", error);
      toast({
        title: "사운드 테스트 실패",
        description: "알림음을 재생할 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  // 예약 리마인드 관련 핸들러 함수들
  const handleReservationReminderChange = async (enabled: boolean) => {
    setReservationReminder(enabled);
    reservationReminderUtil.setEnabled(enabled);
    
    if (enabled) {
      // 알림 권한 요청
      const permissionGranted = await requestNotificationPermission();
      setNotificationPermission(permissionGranted ? 'granted' : 'denied');
      
      if (!permissionGranted) {
        toast({
          title: "알림 권한 필요",
          description: "예약 리마인드를 받으려면 브라우저 알림 권한을 허용해주세요.",
          variant: "destructive",
        });
      }
    }
    
    try {
      await setDoc(doc(db, "settings", "store"), {
        notifications: {
          reservationReminder: enabled
        }
      }, { merge: true });
      
      toast({
        title: enabled ? "예약 리마인드가 활성화되었습니다" : "예약 리마인드가 비활성화되었습니다",
        description: enabled ? "예약 시간 전에 알림을 받을 수 있습니다." : "예약 리마인드 알림이 발송되지 않습니다.",
      });
    } catch (error) {
      console.error("예약 리마인드 설정 저장 오류:", error);
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleReminderTimingChange = (timing: string) => {
    setReminderTiming(timing);
    // Firebase에 저장
    setDoc(doc(db, "settings", "store"), {
      notifications: {
        reminderTiming: timing
      }
    }, { merge: true }).catch(error => {
      console.error("리마인드 타이밍 설정 저장 오류:", error);
    });
  };

  const handleReminderTypeChange = (type: keyof typeof reminderTypes, enabled: boolean) => {
    const newReminderTypes = { ...reminderTypes, [type]: enabled };
    setReminderTypes(newReminderTypes);
    reservationReminderUtil.setReminderTypes(newReminderTypes);
  };

  const handleRequestNotificationPermission = async () => {
    const permissionGranted = await requestNotificationPermission();
    setNotificationPermission(permissionGranted ? 'granted' : 'denied');
    
    if (permissionGranted) {
      toast({
        title: "알림 권한 허용됨",
        description: "이제 예약 리마인드 알림을 받을 수 있습니다.",
      });
    } else {
      toast({
        title: "알림 권한 거부됨",
        description: "브라우저 설정에서 알림 권한을 허용해주세요.",
        variant: "destructive",
      });
    }
  };

  // CSV 다운로드 관련 상태
  const [csvDownloadType, setCsvDownloadType] = useState<'orders' | 'sales' | 'combined'>('combined');
  const [csvDateRange, setCsvDateRange] = useState('lastWeek');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [isDownloading, setIsDownloading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // CSV 다운로드 핸들러 함수
  const handleCSVDownload = async () => {
    if (orders.length === 0) {
      toast({
        title: "다운로드할 데이터가 없습니다",
        description: "주문 데이터가 없어 CSV를 생성할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);

    try {
      // 날짜 범위 계산
      let startDate: Date, endDate: Date;
      
      if (csvDateRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          toast({
            title: "날짜를 선택해주세요",
            description: "시작일과 종료일을 모두 선택해주세요.",
            variant: "destructive",
          });
          setIsDownloading(false);
          return;
        }
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        const dateRangeOptions = getDateRangeOptions();
        const selectedRange = dateRangeOptions[csvDateRange as keyof typeof dateRangeOptions];
        startDate = selectedRange.start;
        endDate = selectedRange.end;
      }

      // CSV 다운로드 실행
      switch (csvDownloadType) {
        case 'orders':
          downloadOrdersCSV(orders, startDate, endDate);
          break;
        case 'sales':
          downloadSalesCSV(orders, startDate, endDate);
          break;
        case 'combined':
          downloadCombinedCSV(orders, startDate, endDate);
          break;
      }

      toast({
        title: "CSV 다운로드 완료",
        description: `${csvDownloadType === 'orders' ? '주문' : csvDownloadType === 'sales' ? '매출' : '통합'} 데이터가 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('CSV 다운로드 오류:', error);
      toast({
        title: "CSV 다운로드 실패",
        description: "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // 주간/월간 리포트 핸들러 함수들
  const handleWeeklyReportChange = async (enabled: boolean) => {
    setWeeklyReport(enabled);
    
    try {
      await setDoc(doc(db, "settings", "store"), {
        salesSettings: {
          weeklyReport: enabled
        }
      }, { merge: true });
      
      toast({
        title: enabled ? "주간 리포트가 활성화되었습니다" : "주간 리포트가 비활성화되었습니다",
        description: enabled ? "매주 월요일에 이메일로 주간 매출 리포트를 받습니다." : "주간 리포트 발송이 중단됩니다.",
      });
    } catch (error) {
      console.error("주간 리포트 설정 저장 오류:", error);
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleMonthlyReportChange = async (enabled: boolean) => {
    setMonthlyReport(enabled);
    
    try {
      await setDoc(doc(db, "settings", "store"), {
        salesSettings: {
          monthlyReport: enabled
        }
      }, { merge: true });
      
      toast({
        title: enabled ? "월간 리포트가 활성화되었습니다" : "월간 리포트가 비활성화되었습니다",
        description: enabled ? "매월 1일에 이메일로 월간 매출 리포트를 받습니다." : "월간 리포트 발송이 중단됩니다.",
      });
    } catch (error) {
      console.error("월간 리포트 설정 저장 오류:", error);
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateWeeklyReport = async () => {
    if (orders.length === 0) {
      toast({
        title: "리포트를 생성할 데이터가 없습니다",
        description: "주문 데이터가 없어 리포트를 생성할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const report = generateWeeklyReport(orders);
      const html = generateReportHTML(report, storeName);
      
      // HTML 파일로 다운로드
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${storeName}_주간매출리포트_${report.startDate}_${report.endDate}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "주간 리포트 생성 완료",
        description: "주간 매출 리포트가 다운로드되었습니다.",
      });
    } catch (error) {
      console.error('주간 리포트 생성 오류:', error);
      toast({
        title: "리포트 생성 실패",
        description: "리포트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateMonthlyReport = async () => {
    if (orders.length === 0) {
      toast({
        title: "리포트를 생성할 데이터가 없습니다",
        description: "주문 데이터가 없어 리포트를 생성할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const report = generateMonthlyReport(orders);
      const html = generateReportHTML(report, storeName);
      
      // HTML 파일로 다운로드
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${storeName}_월간매출리포트_${report.startDate}_${report.endDate}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "월간 리포트 생성 완료",
        description: "월간 매출 리포트가 다운로드되었습니다.",
      });
    } catch (error) {
      console.error('월간 리포트 생성 오류:', error);
      toast({
        title: "리포트 생성 실패",
        description: "리포트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 소셜 로그인 핸들러 함수들
  const handleKakaoLoginChange = async (enabled: boolean) => {
    setKakaoLogin(enabled);
    
    try {
      await setDoc(doc(db, "settings", "store"), {
        loginSettings: {
          kakaoLogin: enabled
        }
      }, { merge: true });
      
      toast({
        title: enabled ? "카카오톡 로그인이 활성화되었습니다" : "카카오톡 로그인이 비활성화되었습니다",
        description: enabled ? "고객이 카카오톡으로 로그인할 수 있습니다." : "카카오톡 로그인이 비활성화됩니다.",
      });
    } catch (error) {
      console.error("카카오톡 로그인 설정 저장 오류:", error);
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleNaverLoginChange = async (enabled: boolean) => {
    setNaverLogin(enabled);
    
    try {
      await setDoc(doc(db, "settings", "store"), {
        loginSettings: {
          naverLogin: enabled
        }
      }, { merge: true });
      
      toast({
        title: enabled ? "네이버 로그인이 활성화되었습니다" : "네이버 로그인이 비활성화되었습니다",
        description: enabled ? "고객이 네이버로 로그인할 수 있습니다." : "네이버 로그인이 비활성화됩니다.",
      });
    } catch (error) {
      console.error("네이버 로그인 설정 저장 오류:", error);
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleTestKakaoLogin = async () => {
    try {
      const userInfo = await kakaoLogin();
      toast({
        title: "카카오톡 로그인 테스트 성공",
        description: `${userInfo.name}님으로 로그인되었습니다.`,
      });
    } catch (error) {
      console.error('카카오톡 로그인 테스트 실패:', error);
      toast({
        title: "카카오톡 로그인 테스트 실패",
        description: error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleTestNaverLogin = async () => {
    try {
      const userInfo = await naverLogin();
      toast({
        title: "네이버 로그인 테스트 성공",
        description: `${userInfo.name}님으로 로그인되었습니다.`,
      });
    } catch (error) {
      console.error('네이버 로그인 테스트 실패:', error);
      toast({
        title: "네이버 로그인 테스트 실패",
        description: error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
          <p className="text-muted-foreground">{t('settingsDescription')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="store" className="gap-1">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">{t('store')}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('account')}</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-1">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">{t('qr')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{t('notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-1">
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">{t('menu')}</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('sales')}</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t('messages')}</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t('system')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Store Information Tab */}
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  {t('storeInfo')}
                </CardTitle>
                <CardDescription>{t('storeInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">{t('storeName')}</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">{t('phone')}</Label>
                    <Input
                      id="storePhone"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">{t('address')}</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="storeAddress"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        placeholder={t('addressPlaceholder')}
                        className="flex-1"
                      />
                      <Button variant="outline" className="gap-2">
                        <MapPin className="w-4 h-4" />
                        {t('mapIntegration')}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('addressHelp')}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orderSiteUrl">{t('orderSiteUrl')}</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="orderSiteUrl"
                        value={`${window.location.origin}/order/${storeName || 'store'}`}
                        readOnly
                        className="flex-1 bg-muted"
                      />
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => window.open(`${window.location.origin}/order/${storeName || 'store'}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t('openSiteButton')}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('urlHelp')}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t('businessHours')}</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        // 모든 요일을 기본 영업시간으로 설정
                        const defaultHours = {
                          monday: { open: "09:00", close: "22:00", closed: false },
                          tuesday: { open: "09:00", close: "22:00", closed: false },
                          wednesday: { open: "09:00", close: "22:00", closed: false },
                          thursday: { open: "09:00", close: "22:00", closed: false },
                          friday: { open: "09:00", close: "22:00", closed: false },
                          saturday: { open: "10:00", close: "23:00", closed: false },
                          sunday: { open: "10:00", close: "22:00", closed: false },
                        };
                        setBusinessHours(defaultHours);
                        
                        // Firebase에 즉시 저장
                        try {
                          const settingsRef = doc(db, "settings", "store");
                          await setDoc(settingsRef, {
                            businessHours: defaultHours,
                            updatedAt: new Date()
                          }, { merge: true });
                          
                          toast({
                            title: t('defaultSetComplete'),
                            description: t('defaultSetCompleteDesc'),
                          });
                        } catch (error) {
                          console.error("기본값 설정 저장 오류:", error);
                          toast({
                            title: t('settingSaveError'),
                            description: t('settingSaveErrorDesc'),
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      {t('setDefault')}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {days.map((day) => (
                      <div key={day.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-20 text-sm font-medium">{t(day.id)}</div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!businessHours[day.id].closed}
                            onCheckedChange={(checked) => 
                              handleBusinessHoursChange(day.id, 'closed', !checked)
                            }
                          />
                          <span className="text-sm min-w-[40px]">
                            {businessHours[day.id].closed ? t('closed') : t('openStatus')}
                          </span>
                        </div>
                        {!businessHours[day.id].closed && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">{t('open')}</Label>
                              <Input
                                type="time"
                                value={businessHours[day.id].open}
                                onChange={(e) => 
                                  handleBusinessHoursChange(day.id, 'open', e.target.value)
                                }
                                className="w-24 h-8 text-sm"
                              />
                            </div>
                            <span className="text-muted-foreground">~</span>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">{t('close')}</Label>
                              <Input
                                type="time"
                                value={businessHours[day.id].close}
                                onChange={(e) => 
                                  handleBusinessHoursChange(day.id, 'close', e.target.value)
                                }
                                className="w-24 h-8 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">{t('businessHoursPreview')}</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {days.map((day) => (
                        <div key={day.id} className="flex justify-between">
                          <span>{t(day.id)}</span>
                          <span>
                            {businessHours[day.id].closed 
                              ? t('closed') 
                              : `${businessHours[day.id].open} - ${businessHours[day.id].close}`
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleSaveStoreInfo} className="w-full">
                  {t('saveStoreInfo')}
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
                  {t('accountSettings')}
                </CardTitle>
                <CardDescription>{t('accountSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('accountInfo')}</h3>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">{t('adminEmail')}</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      readOnly
                      disabled
                      className="bg-muted"
                      placeholder={t('emailHelp')}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('emailHelp')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('passwordChange')}</h3>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('newPassword')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePasswordChange} variant="outline">
                    {t('changePassword')}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('socialLogin')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">K</span>
                        </div>
                          <div>
                            <div className="font-medium">{t('kakaoLogin')}</div>
                            <div className="text-sm text-muted-foreground">
                              고객이 카카오톡 계정으로 로그인할 수 있습니다
                      </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleTestKakaoLogin}
                          className="gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          테스트
                        </Button>
                        <Switch checked={kakaoLogin} onCheckedChange={handleKakaoLoginChange} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">N</span>
                        </div>
                          <div>
                            <div className="font-medium">{t('naverLogin')}</div>
                            <div className="text-sm text-muted-foreground">
                              고객이 네이버 계정으로 로그인할 수 있습니다
                      </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleTestNaverLogin}
                          className="gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          테스트
                        </Button>
                        <Switch checked={naverLogin} onCheckedChange={handleNaverLoginChange} />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('loginHistory')}</h3>
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">{t('recentLogin')}</div>
                    <div className="text-sm text-muted-foreground">2024년 1월 15일 오후 2:30</div>
                    <div className="text-sm text-muted-foreground">IP: 192.168.1.100</div>
                  </div>
                  <Button onClick={handleLogout} variant="destructive" className="w-full">
                    {t('logout')}
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
                      {t('qrTableManagement')}
                    </CardTitle>
                    <CardDescription>{t('qrTableManagementDesc')}</CardDescription>
                  </div>
                  {tables.length > 0 && (
                    <Button 
                      onClick={handleBatchDownloadQR}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('batchDownload')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t('registeredTables')}</h3>
                    <Badge variant="secondary">{t('totalTables', { count: tables.length })}</Badge>
                  </div>
                  
                  {tables.length === 0 ? (
                    <div className="text-center py-12">
                      <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">{t('noTables')}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t('noTablesDesc')}
                      </p>
                      <Button variant="outline">{t('goToOrders')}</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {tables.map((table) => (
                        <Card key={table.id} className="p-3">
                          <div className="flex flex-col items-center space-y-2">
                            <h4 className="text-sm font-medium">T-{table.id.toString().padStart(2, '0')}</h4>
                            
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border border-dashed">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(`${window.location.origin}/order/${storeName || 'store'}/table-${table.id}`)}`}
                                alt={`QR Code for Table ${table.id}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            
                            <div className="w-full text-center">
                              <div 
                                className="text-xs font-mono bg-muted px-1 py-1 rounded truncate cursor-pointer hover:bg-muted/80 transition-colors"
                                onClick={() => handleUrlClick(table.id)}
                                title={t('openSite')}
                              >
                                {`${window.location.origin}/order/${storeName || 'store'}/table-${table.id}`}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1 w-full">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-6 gap-1"
                                onClick={() => handleDownloadQR(table.id, table.name)}
                              >
                                <Download className="w-3 h-3" />
                                {t('download')}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-6 gap-1"
                                onClick={() => handleReissueQR(table.id, table.name)}
                              >
                                <QrCode className="w-3 h-3" />
                                {t('reissue')}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-6 gap-1"
                                onClick={() => handleUrlClick(table.id)}
                              >
                                <ExternalLink className="w-3 h-3" />
                                {t('openSiteButton')}
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
                        <p className="font-medium">{t('tableManagementGuide')}</p>
                        <p className="text-muted-foreground mt-1">
                          {t('tableManagementDesc')}
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
                  {t('notificationsSettings')}
                </CardTitle>
                <CardDescription>{t('notificationsSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{t('reservationReminder')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('reservationReminderDesc')}
                      </div>
                    </div>
                    <Switch
                      checked={reservationReminder}
                      onCheckedChange={handleReservationReminderChange}
                    />
                  </div>

                  {reservationReminder && (
                    <div className="ml-4 space-y-4">
                      {/* 알림 권한 상태 */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">브라우저 알림 권한</div>
                          <div className="text-sm text-muted-foreground">
                            {notificationPermission === 'granted' 
                              ? '알림 권한이 허용되었습니다.' 
                              : notificationPermission === 'denied'
                              ? '알림 권한이 거부되었습니다.'
                              : '알림 권한을 요청해주세요.'}
                          </div>
                        </div>
                        {notificationPermission !== 'granted' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRequestNotificationPermission}
                          >
                            권한 요청
                          </Button>
                        )}
                      </div>

                      {/* 리마인드 타이밍 */}
                      <div className="space-y-2">
                        <Label>기본 리마인드 시간</Label>
                        <Select value={reminderTiming} onValueChange={handleReminderTimingChange}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{t('oneHourBefore')}</SelectItem>
                          <SelectItem value="2">{t('twoHoursBefore')}</SelectItem>
                          <SelectItem value="3">{t('threeHoursBefore')}</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>

                      {/* 리마인드 타입 선택 */}
                      <div className="space-y-2">
                        <Label>리마인드 알림 설정</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={reminderTypes.before30min}
                              onCheckedChange={(checked) => handleReminderTypeChange('before30min', checked)}
                            />
                            <Label>30분 전 알림</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={reminderTypes.before1hour}
                              onCheckedChange={(checked) => handleReminderTypeChange('before1hour', checked)}
                            />
                            <Label>1시간 전 알림</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={reminderTypes.before2hours}
                              onCheckedChange={(checked) => handleReminderTypeChange('before2hours', checked)}
                            />
                            <Label>2시간 전 알림</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{t('cookingSound')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('cookingSoundDesc')}
                      </div>
                    </div>
                    <Switch
                      checked={cookingSound}
                      onCheckedChange={handleCookingSoundChange}
                    />
                  </div>

                  {cookingSound && (
                    <div className="ml-4 space-y-4">
                      {/* 사운드 타입 선택 */}
                      <div className="space-y-2">
                        <Label>알림음 종류</Label>
                        <Select value={soundType} onValueChange={handleSoundTypeChange}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">기본 알림음</SelectItem>
                            <SelectItem value="bell">종소리</SelectItem>
                            <SelectItem value="chime">차임벨</SelectItem>
                            <SelectItem value="notification">알림음</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 볼륨 조절 */}
                      <div className="space-y-2">
                        <Label>볼륨: {Math.round(soundVolume * 100)}%</Label>
                        <Slider
                          value={[soundVolume]}
                          onValueChange={handleSoundVolumeChange}
                          max={1}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* 테스트 버튼 */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleTestSound}
                          className="gap-2"
                        >
                          <Play className="w-4 h-4" />
                          알림음 테스트
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          버튼을 클릭하여 알림음을 확인하세요
                        </span>
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
                  {t('menuSettings')}
                </CardTitle>
                <CardDescription>{t('menuSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('defaultBadge')}</Label>
                    <Select value={defaultBadge} onValueChange={setDefaultBadge}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('noBadge')}</SelectItem>
                        <SelectItem value="recommended">{t('recommended')}</SelectItem>
                        <SelectItem value="best">{t('bestMenu')}</SelectItem>
                        <SelectItem value="new">{t('newMenu')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{t('autoHideSoldOut')}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('autoHideSoldOutDesc')}
                      </div>
                    </div>
                    <Switch
                      checked={autoHideSoldOut}
                      onCheckedChange={setAutoHideSoldOut}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('defaultIconSet')}</Label>
                    <Select value={defaultIconSet} onValueChange={setDefaultIconSet}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">{t('modernStyle')}</SelectItem>
                        <SelectItem value="classic">{t('classicStyle')}</SelectItem>
                        <SelectItem value="minimal">{t('minimalStyle')}</SelectItem>
                        <SelectItem value="colorful">{t('colorfulStyle')}</SelectItem>
                      </SelectContent>
                    </Select>
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
                  {t('salesSettings')}
                </CardTitle>
                <CardDescription>{t('salesSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('dataExport')}</h3>
                  
                  {/* CSV 다운로드 타입 선택 */}
                  <div className="space-y-2">
                    <Label>다운로드 데이터 타입</Label>
                    <Select value={csvDownloadType} onValueChange={(value: 'orders' | 'sales' | 'combined') => setCsvDownloadType(value)}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orders">주문 상세 데이터</SelectItem>
                        <SelectItem value="sales">매출 요약 데이터</SelectItem>
                        <SelectItem value="combined">통합 데이터 (주문 + 매출)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 날짜 범위 선택 */}
                  <div className="space-y-2">
                    <Label>날짜 범위</Label>
                    <Select value={csvDateRange} onValueChange={setCsvDateRange}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">오늘</SelectItem>
                        <SelectItem value="yesterday">어제</SelectItem>
                        <SelectItem value="lastWeek">최근 7일</SelectItem>
                        <SelectItem value="lastMonth">최근 30일</SelectItem>
                        <SelectItem value="last3Months">최근 3개월</SelectItem>
                        <SelectItem value="custom">사용자 지정</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 커스텀 날짜 선택 */}
                  {csvDateRange === 'custom' && (
                    <div className="space-y-2">
                      <Label>날짜 범위 선택</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-48 justify-start text-left font-normal",
                                !customStartDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customStartDate ? format(customStartDate, "PPP", { locale: ko }) : "시작일 선택"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={customStartDate}
                              onSelect={(date) => setCustomStartDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-48 justify-start text-left font-normal",
                                !customEndDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customEndDate ? format(customEndDate, "PPP", { locale: ko }) : "종료일 선택"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={customEndDate}
                              onSelect={(date) => setCustomEndDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {/* 다운로드 버튼 */}
                  <Button 
                    onClick={handleCSVDownload} 
                    disabled={isDownloading || orders.length === 0}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? '다운로드 중...' : t('downloadSalesData')}
                  </Button>
                  
                  {orders.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      다운로드할 주문 데이터가 없습니다.
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('autoReportSettings')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{t('weeklyReport')}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('weeklyReportDesc')}
                        </div>
                      </div>
                      <Switch checked={weeklyReport} onCheckedChange={handleWeeklyReportChange} />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{t('monthlyReport')}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('monthlyReportDesc')}
                        </div>
                      </div>
                      <Switch checked={monthlyReport} onCheckedChange={handleMonthlyReportChange} />
                    </div>
                  </div>

                  {/* 수동 리포트 생성 */}
                  <div className="space-y-3">
                    <h4 className="font-medium">수동 리포트 생성</h4>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleGenerateWeeklyReport}
                        disabled={orders.length === 0}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        주간 리포트 생성
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleGenerateMonthlyReport}
                        disabled={orders.length === 0}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        월간 리포트 생성
                      </Button>
                    </div>
                    {orders.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        리포트를 생성할 주문 데이터가 없습니다.
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{t('visitorTracking')}</h3>
                  <div className="space-y-2">
                    <Label>{t('trackingMethod')}</Label>
                    <Select value={visitorTracking} onValueChange={setVisitorTracking}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estimated">{t('orderBased')}</SelectItem>
                        <SelectItem value="manual">{t('manualInput')}</SelectItem>
                        <SelectItem value="qr">{t('qrBased')}</SelectItem>
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
                  {t('customerMessages')}
                </CardTitle>
                <CardDescription>{t('customerMessagesDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(customMessages).map(([type, message]) => {
                  const isCustom = useCustomMessage[type as keyof typeof useCustomMessage];
                  const templates = messageTemplates[type as keyof typeof messageTemplates];

                  
                  return (
                    <div key={type} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {type === 'orderComplete' && t('orderCompleteMessage')}
                          {type === 'reservationConfirmed' && t('reservationConfirmedMessage')}
                          {type === 'servingComplete' && t('servingCompleteMessage')}
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
                          <Label>{t('templateSelection')}</Label>
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
                          <Label>{t('customMessage')}</Label>
                          <Textarea
                            value={message}
                            onChange={(e) =>
                              setCustomMessages(prev => ({ ...prev, [type]: e.target.value }))
                            }
                            placeholder={t('customMessagePlaceholder')}
                            rows={3}
                          />
                        </div>
                      )}
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">{t('preview')}</div>
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
                  {t('systemSettings')}
                </CardTitle>
                <CardDescription>{t('systemSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      <div>
                        <div className="font-medium">{t('darkMode')}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('darkModeDesc')}
                        </div>
                      </div>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={handleDarkModeChange} />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('languageSettings')}
                    </Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    {t('appInfo')}
                  </h3>
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('appVersion')}</span>
                      <Badge variant="outline">v2.1.0</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('lastUpdate')}</span>
                      <span className="text-sm text-muted-foreground">2024.01.15</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('updateNotification')}</span>
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {t('latest')}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    {t('checkUpdate')}
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