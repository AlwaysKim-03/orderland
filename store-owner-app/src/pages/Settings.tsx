import { Card, CardContent } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { 
  Store, 
  User, 
  QrCode, 
  Bell, 
  Settings as SettingsIcon,
  ChevronRight,
  Moon,
  Sun,
  Phone,
  FileText,
  Info
} from "lucide-react";
import { toast } from "../hooks/use-toast";
import { useState } from "react";
import StoreSettings from "./StoreSettings";
import AccountSettings from "./AccountSettings";
import QRManagement from "./QRManagement";
import NotificationSettings from "./NotificationSettings";
import SystemSettings from "./SystemSettings";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [currentView, setCurrentView] = useState<'main' | 'store' | 'account' | 'qr' | 'notifications' | 'system'>('main');

  const handleSettingClick = (settingName: string) => {
    toast({
      title: "준비 중인 기능입니다",
      description: `${settingName} 기능을 개발 중입니다.`,
    });
  };

  const handleToggle = (setting: string, value: boolean) => {
    toast({
      title: "설정이 변경되었습니다",
      description: `${setting}이 ${value ? '켜짐' : '꺼짐'} 상태로 변경되었습니다.`,
    });
  };

  const settingItems = [
    {
      icon: Store,
      title: "매장 정보",
      subtitle: "매장 이름, 주소, 영업시간 설정",
      currentValue: "마마돈까스",
      onClick: () => setCurrentView('store')
    },
    {
      icon: User,
      title: "계정 및 보안",
      subtitle: "이메일, 비밀번호, 로그인 기록",
      currentValue: "최근 접속: 오늘",
      onClick: () => setCurrentView('account')
    },
    {
      icon: QrCode,
      title: "테이블 & QR코드",
      subtitle: "테이블별 QR코드 보기 및 다운로드",
      currentValue: "총 6개 테이블",
      onClick: () => setCurrentView('qr')
    }
  ];

  // Show Store Settings if selected
  if (currentView === 'store') {
    return <StoreSettings onBack={() => setCurrentView('main')} />;
  }

  // Show Account Settings if selected
  if (currentView === 'account') {
    return <AccountSettings onBack={() => setCurrentView('main')} />;
  }

  // Show QR Management if selected
  if (currentView === 'qr') {
    return <QRManagement onBack={() => setCurrentView('main')} />;
  }

  // Show Notification Settings if selected
  if (currentView === 'notifications') {
    return <NotificationSettings onBack={() => setCurrentView('main')} />;
  }

  // Show System Settings if selected
  if (currentView === 'system') {
    return <SystemSettings onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">설정</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 space-y-6">
        {/* Main Settings Cards */}
        <div className="space-y-4">
          {settingItems.map((item, index) => (
            <Card key={index} className="transition-all duration-200 hover:shadow-md active:scale-[0.98]">
              <CardContent className="p-4">
                <button 
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      <p className="text-xs text-primary mt-1">{item.currentValue}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toggle Settings */}
        <div className="space-y-4">
          {/* Notifications */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                    <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">알림 & 호출</h3>
                    <p className="text-sm text-muted-foreground">주문/호출 알림음, 벨소리 설정</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications}
                  onCheckedChange={(checked) => {
                    setNotifications(checked);
                    if (checked) {
                      setCurrentView('notifications');
                    } else {
                      handleToggle("알림", checked);
                    }
                  }}
                />
              </div>
              {notifications && (
                <div className="mt-4 pl-16">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSettingClick("알림음 테스트")}
                  >
                    알림음 테스트
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dark Mode / System Settings */}
          <Card>
            <CardContent className="p-4">
              <button 
                onClick={() => setCurrentView('system')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                    {darkMode ? (
                      <Moon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Sun className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">시스템 설정</h3>
                    <p className="text-sm text-muted-foreground">다크모드, 앱 버전, 고객센터</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Links */}
        <div className="pt-8 pb-8">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground font-medium">오더랜드 v1.0.3</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground h-12"
              onClick={() => handleSettingClick("고객센터")}
            >
              <Phone className="h-4 w-4 mr-3" />
              고객센터 문의하기
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground h-12"
              onClick={() => handleSettingClick("이용약관")}
            >
              <FileText className="h-4 w-4 mr-3" />
              이용약관
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground h-12"
              onClick={() => handleSettingClick("개발사 정보")}
            >
              <Info className="h-4 w-4 mr-3" />
              개발사 정보
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}