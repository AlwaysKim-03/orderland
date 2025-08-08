import { useState } from "react";
import { ArrowLeft, Moon, Sun, Smartphone, CheckCircle, ExternalLink, Phone, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

interface SystemSettingsProps {
  onBack: () => void;
}

export default function SystemSettings({ onBack }: SystemSettingsProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [isLatestVersion] = useState(true);
  const appVersion = "1.0.3";

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    toast({
      title: enabled ? "다크모드 적용" : "라이트모드 적용",
      description: enabled ? "다크모드가 적용되었습니다." : "라이트모드가 적용되었습니다.",
    });
  };

  const handleUpdateCheck = () => {
    toast({
      title: "업데이트 확인",
      description: "최신 버전을 사용 중입니다. 업데이트가 필요하지 않습니다.",
    });
  };

  const handleCustomerSupport = () => {
    toast({
      title: "고객센터 연결",
      description: "고객센터 연결 기능은 백엔드 연동 후 사용 가능합니다.",
    });
  };

  const handleTermsOfService = () => {
    toast({
      title: "이용약관",
      description: "이용약관 페이지 연결 기능은 백엔드 연동 후 사용 가능합니다.",
    });
  };

  const handlePrivacyPolicy = () => {
    toast({
      title: "개인정보 처리방침",
      description: "개인정보 처리방침 페이지 연결 기능은 백엔드 연동 후 사용 가능합니다.",
    });
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
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
            <h1 className="text-xl font-bold">시스템 설정</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 pb-24 space-y-6">
        {/* Theme Settings */}
        <Card className="transition-all duration-300">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">화면 모드 설정</h3>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors duration-300 ${darkMode ? 'bg-slate-900/10' : 'bg-yellow-100'}`}>
                    {darkMode ? (
                      <Moon className="h-6 w-6 text-slate-600" />
                    ) : (
                      <Sun className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <Label className="font-medium text-base">
                      {darkMode ? "다크모드" : "라이트모드"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      눈이 편안한 다크모드로 전환할 수 있어요.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Info Section */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">앱 정보</h3>
              
              {/* Version Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">버전 정보</p>
                    <p className="text-sm text-muted-foreground">오더랜드 v{appVersion}</p>
                  </div>
                </div>
                {isLatestVersion && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">최신 버전</span>
                  </div>
                )}
              </div>

              {/* Update Check Button */}
              <Button 
                variant="outline" 
                onClick={handleUpdateCheck}
                className="w-full"
              >
                업데이트 확인
              </Button>

              {isLatestVersion && (
                <p className="text-center text-sm text-green-600 font-medium">
                  ✅ 최신 버전입니다!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Support & Policy Links */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">고객센터 & 약관</h3>
              
              <div className="space-y-3">
                {/* Customer Support */}
                <button
                  onClick={handleCustomerSupport}
                  className="w-full flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">고객센터 문의하기</p>
                      <p className="text-sm text-muted-foreground">궁금한 점이나 문제 해결</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Terms of Service */}
                <button
                  onClick={handleTermsOfService}
                  className="w-full flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">이용약관 보기</p>
                      <p className="text-sm text-muted-foreground">서비스 이용 약관 및 정책</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Privacy Policy */}
                <button
                  onClick={handlePrivacyPolicy}
                  className="w-full flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">개인정보 처리방침</p>
                      <p className="text-sm text-muted-foreground">개인정보 수집 및 이용 정책</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            오더랜드와 함께 매장 운영을 더욱 스마트하게! 🍽️
          </p>
        </div>
      </div>
    </div>
  );
}