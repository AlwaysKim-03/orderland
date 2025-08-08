import { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { toast } from "../hooks/use-toast";

interface AccountSettingsProps {
  onBack: () => void;
}

export default function AccountSettings({ onBack }: AccountSettingsProps) {
  const [currentEmail] = useState("owner@orderland.com");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const socialProviders = [
    { 
      id: "kakao", 
      name: "카카오", 
      icon: "💬", 
      connected: true,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    },
    { 
      id: "google", 
      name: "구글", 
      icon: "🔍", 
      connected: false,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    },
    { 
      id: "apple", 
      name: "애플", 
      icon: "🍎", 
      connected: false,
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  ];

  const loginHistory = [
    {
      date: "2025.07.25",
      time: "14:30",
      device: "iPhone · Safari",
      location: "서울"
    },
    {
      date: "2025.07.24",
      time: "09:15",
      device: "iPhone · Safari",
      location: "서울"
    },
    {
      date: "2025.07.23",
      time: "18:45",
      device: "MacBook · Chrome",
      location: "서울"
    }
  ];

  const handleEmailChange = () => {
    if (!newEmail.trim() || !currentPassword.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "이메일 변경 요청",
      description: "이메일 변경 기능은 백엔드 연동 후 사용 가능합니다.",
    });
    setEmailModalOpen(false);
    setNewEmail("");
    setCurrentPassword("");
  };

  const handlePasswordChange = () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "비밀번호 변경 요청",
      description: "비밀번호 변경 기능은 백엔드 연동 후 사용 가능합니다.",
    });
    setPasswordModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSocialToggle = (providerId: string, connected: boolean) => {
    toast({
      title: connected ? "소셜 로그인 해제" : "소셜 로그인 연동",
      description: "소셜 로그인 기능은 백엔드 연동 후 사용 가능합니다.",
    });
  };

  const handleLogout = () => {
    toast({
      title: "로그아웃 요청",
      description: "로그아웃 기능은 백엔드 연동 후 사용 가능합니다.",
    });
  };

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
            <h1 className="text-xl font-bold">계정 및 보안</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 pb-24 space-y-6">
        {/* Email Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">이메일 주소</Label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{currentEmail}</span>
              <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">수정하기</Button>
                </DialogTrigger>
                <DialogContent className="w-[90%] max-w-md">
                  <DialogHeader>
                    <DialogTitle>이메일 변경</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">새 이메일 주소</Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="새 이메일을 입력하세요"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current-password-email">현재 비밀번호</Label>
                      <div className="relative">
                        <Input
                          id="current-password-email"
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="현재 비밀번호를 입력하세요"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setEmailModalOpen(false)}
                        className="flex-1"
                      >
                        취소
                      </Button>
                      <Button 
                        onClick={handleEmailChange}
                        className="flex-1"
                      >
                        저장
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">비밀번호 변경</Label>
            </div>
            <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">비밀번호 변경하기</Button>
              </DialogTrigger>
              <DialogContent className="w-[90%] max-w-md">
                <DialogHeader>
                  <DialogTitle>비밀번호 변경</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">현재 비밀번호</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="현재 비밀번호를 입력하세요"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">새 비밀번호</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="새 비밀번호를 입력하세요"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="새 비밀번호를 다시 입력하세요"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setPasswordModalOpen(false)}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button 
                      onClick={handlePasswordChange}
                      className="flex-1"
                    >
                      변경하기
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Social Login Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">소셜 로그인 연동</Label>
            </div>
            <div className="space-y-3">
              {socialProviders.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{provider.icon}</span>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className={`text-xs px-2 py-1 rounded-full inline-block ${provider.color}`}>
                        {provider.connected ? "연동됨" : "연동 안됨"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={provider.connected}
                    onCheckedChange={(checked) => handleSocialToggle(provider.id, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Login History Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Label className="text-base font-semibold">최근 로그인 기록</Label>
            <div className="space-y-3">
              {loginHistory.map((login, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{login.date} · {login.time}</p>
                    <p className="text-xs text-muted-foreground">{login.device}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{login.location}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full text-primary">
              전체 보기
            </Button>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card>
          <CardContent className="p-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  로그아웃
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[90%] max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>로그아웃 확인</AlertDialogTitle>
                  <AlertDialogDescription>
                    정말 로그아웃 하시겠습니까?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    로그아웃
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}