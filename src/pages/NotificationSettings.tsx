import { useState } from "react";
import { ArrowLeft, Bell, Users, Calendar, Volume2, Play, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface NotificationSettingsProps {
  onBack: () => void;
}

export default function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [staffCallNotifications, setStaffCallNotifications] = useState(true);
  const [reservationReminders, setReservationReminders] = useState(false);
  const [selectedSoundId, setSelectedSoundId] = useState("bell1");
  const [reminderTime, setReminderTime] = useState("30min");
  const [soundPreviewOpen, setSoundPreviewOpen] = useState(false);

  const notificationSounds = [
    { id: "bell1", name: "벨소리 1", description: "부드러운 종소리" },
    { id: "bell2", name: "벨소리 2", description: "경쾌한 차임" },
    { id: "bell3", name: "벨소리 3", description: "클래식 딩동" },
    { id: "chime1", name: "차임 1", description: "우아한 멜로디" },
    { id: "chime2", name: "차임 2", description: "현대적 사운드" }
  ];

  const reminderTimeOptions = [
    { value: "10min", label: "10분 전" },
    { value: "30min", label: "30분 전" },
    { value: "1hour", label: "1시간 전" },
    { value: "custom", label: "사용자 지정" }
  ];

  const handleNotificationToggle = (type: string, enabled: boolean) => {
    const messages = {
      order: enabled ? "주문 알림이 켜졌습니다" : "주문 알림이 꺼졌습니다",
      staff: enabled ? "직원 호출 알림이 켜졌습니다" : "직원 호출 알림이 꺼졌습니다",
      reservation: enabled ? "예약 리마인드 알림이 켜졌습니다" : "예약 리마인드 알림이 꺼졌습니다"
    };

    switch (type) {
      case "order":
        setOrderNotifications(enabled);
        break;
      case "staff":
        setStaffCallNotifications(enabled);
        break;
      case "reservation":
        setReservationReminders(enabled);
        break;
    }

    toast({
      title: "알림 설정 변경",
      description: messages[type as keyof typeof messages],
    });
  };

  const handleSoundChange = (soundId: string) => {
    setSelectedSoundId(soundId);
    const selectedSound = notificationSounds.find(sound => sound.id === soundId);
    toast({
      title: "알림음 변경",
      description: `${selectedSound?.name}(으)로 설정되었습니다.`,
    });
  };

  const handleSoundPreview = () => {
    const selectedSound = notificationSounds.find(sound => sound.id === selectedSoundId);
    toast({
      title: "알림음 미리듣기",
      description: `${selectedSound?.name} 재생 중...`,
    });
    setSoundPreviewOpen(true);
    
    // Auto close preview after 3 seconds
    setTimeout(() => {
      setSoundPreviewOpen(false);
    }, 3000);
  };

  const handleTestNotification = () => {
    toast({
      title: "테스트 알림 전송",
      description: "테스트 알림이 전송되었습니다. 알림 설정을 확인해보세요.",
    });
  };

  const handleReminderTimeChange = (time: string) => {
    setReminderTime(time);
    const selectedOption = reminderTimeOptions.find(option => option.value === time);
    toast({
      title: "리마인드 시간 변경",
      description: `예약 ${selectedOption?.label}에 알림이 전송됩니다.`,
    });
  };

  const anyNotificationEnabled = orderNotifications || staffCallNotifications || reservationReminders;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">알림 & 호출</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 pb-24 space-y-6">
        {/* Notification Toggles Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">알림 설정</h2>
          
          {/* Order Notifications */}
          <Card className={`transition-all duration-200 ${orderNotifications ? 'border-primary/20 bg-primary/5' : 'bg-muted/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${orderNotifications ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Bell className={`h-5 w-5 ${orderNotifications ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${orderNotifications ? 'text-foreground' : 'text-muted-foreground'}`}>
                      주문 알림
                    </h3>
                    <p className="text-sm text-muted-foreground">새로운 고객 주문 알림</p>
                    {!orderNotifications && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">OFF</span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={orderNotifications}
                  onCheckedChange={(checked) => handleNotificationToggle("order", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Staff Call Notifications */}
          <Card className={`transition-all duration-200 ${staffCallNotifications ? 'border-primary/20 bg-primary/5' : 'bg-muted/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${staffCallNotifications ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Users className={`h-5 w-5 ${staffCallNotifications ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${staffCallNotifications ? 'text-foreground' : 'text-muted-foreground'}`}>
                      직원 호출 알림
                    </h3>
                    <p className="text-sm text-muted-foreground">고객 서비스 요청 알림</p>
                    {!staffCallNotifications && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">OFF</span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={staffCallNotifications}
                  onCheckedChange={(checked) => handleNotificationToggle("staff", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reservation Reminders */}
          <Card className={`transition-all duration-200 ${reservationReminders ? 'border-primary/20 bg-primary/5' : 'bg-muted/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${reservationReminders ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Calendar className={`h-5 w-5 ${reservationReminders ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${reservationReminders ? 'text-foreground' : 'text-muted-foreground'}`}>
                      예약 리마인드 알림
                    </h3>
                    <p className="text-sm text-muted-foreground">예약 전 미리 알림</p>
                    {!reservationReminders && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">OFF</span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={reservationReminders}
                  onCheckedChange={(checked) => handleNotificationToggle("reservation", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sound Settings Section */}
        {anyNotificationEnabled && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">알림음 설정</h3>
              </div>

              {/* Sound Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">알림음 선택</Label>
                <Select value={selectedSoundId} onValueChange={handleSoundChange}>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder="알림음을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {notificationSounds.map((sound) => (
                      <SelectItem key={sound.id} value={sound.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{sound.name}</span>
                          <span className="text-xs text-muted-foreground">{sound.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sound Preview and Test Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSoundPreview}
                  className="flex-1 gap-2"
                >
                  <Play className="h-4 w-4" />
                  미리듣기
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestNotification}
                  className="flex-1 gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  테스트 알림 보내기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reservation Reminder Time Settings */}
        {reservationReminders && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">예약 전 리마인드 시간</h3>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">알림 전송 시점</Label>
                <Select value={reminderTime} onValueChange={handleReminderTimeChange}>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder="리마인드 시간을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {reminderTimeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reminderTime === "custom" && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    사용자 지정 시간 설정은 백엔드 연동 후 사용 가능합니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Section when all notifications are off */}
        {!anyNotificationEnabled && (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="p-6 text-center">
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground">모든 알림이 꺼져있습니다</h3>
                  <p className="text-sm text-muted-foreground">
                    중요한 주문과 호출을 놓치지 않도록<br/>
                    알림을 켜는 것을 권장합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sound Preview Modal */}
      <Dialog open={soundPreviewOpen} onOpenChange={setSoundPreviewOpen}>
        <DialogContent className="w-[90%] max-w-sm">
          <DialogHeader>
            <DialogTitle>알림음 미리듣기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <Volume2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {notificationSounds.find(sound => sound.id === selectedSoundId)?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {notificationSounds.find(sound => sound.id === selectedSoundId)?.description}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">재생 중...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}