import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuthStep = "phone" | "email" | "business";

interface OwnerAuthProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export function OwnerAuth({ onLoginSuccess, onBack }: OwnerAuthProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    email: "",
    businessNumber: "",
    businessName: "",
    businessType: ""
  });
  const { toast } = useToast();

  const handlePhoneAuth = async () => {
    if (!formData.phone || !formData.name) {
      toast({
        title: "입력 확인",
        description: "전화번호와 이름을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    // Simulate sending verification code
    setTimeout(() => {
      setIsLoading(false);
      setVerificationSent(true);
      toast({
        title: "인증번호를 전송했어요 📱",
        description: "문자로 받은 6자리 인증번호를 입력해주세요.",
      });
    }, 1500);
  };

  const handleVerificationSubmit = () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "인증번호 확인",
        description: "6자리 인증번호를 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep("email");
    toast({
      title: "전화번호 인증 완료! ✅",
      description: "이메일 인증을 진행해주세요.",
    });
  };

  const handleEmailAuth = async () => {
    if (!formData.email) {
      toast({
        title: "이메일 확인",
        description: "이메일 주소를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep("business");
      toast({
        title: "인증 메일을 보냈어요 📧",
        description: "이메일 인증 후 사업자 정보를 입력해주세요.",
      });
    }, 1500);
  };

  const handleBusinessInfoSubmit = async () => {
    if (!formData.businessNumber || !formData.businessName || !formData.businessType) {
      toast({
        title: "정보 입력 확인",
        description: "모든 사업자 정보를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "등록 완료! 🎉",
        description: "사장님 계정이 성공적으로 생성되었습니다.",
      });
      onLoginSuccess();
    }, 2000);
  };

  const renderPhoneStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">📱</div>
        <h2 className="mobile-title mb-3">간편하게 시작하세요</h2>
        <p className="mobile-body text-muted-foreground">
          오더랜드는 복잡한 가입 없이<br />
          전화번호만으로 시작할 수 있어요.
        </p>
      </div>

      {!verificationSent ? (
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-medium">
              📞 전화번호
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="h-12 text-base"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">
              🙍 이름
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="h-12 text-base"
            />
          </div>

          <Button
            onClick={handlePhoneAuth}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium mt-6"
          >
            {isLoading ? "전송 중..." : "인증번호 받기"}
          </Button>
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          <div className="text-center mb-4">
            <p className="mobile-body text-muted-foreground">
              {formData.phone}로 인증번호를 보냈어요
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code" className="text-base font-medium">
              🔐 인증번호 (6자리)
            </Label>
            <Input
              id="code"
              type="number"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="h-12 text-base text-center tracking-widest"
              maxLength={6}
            />
          </div>

          <Button
            onClick={handleVerificationSubmit}
            className="w-full h-12 text-base font-medium"
          >
            확인
          </Button>
        </Card>
      )}
    </div>
  );

  const renderEmailStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="mobile-title mb-3">이메일 인증</h2>
        <p className="mobile-body text-muted-foreground">
          이메일 인증 후 계속 진행됩니다.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium">
            📧 이메일 주소
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="orderland@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="h-12 text-base"
          />
        </div>

        <Button
          onClick={handleEmailAuth}
          disabled={isLoading}
          className="w-full h-12 text-base font-medium"
        >
          {isLoading ? "전송 중..." : "인증 메일 보내기"}
        </Button>
      </Card>
    </div>
  );

  const renderBusinessStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🏪</div>
        <h2 className="mobile-title mb-3">사업자 정보 입력</h2>
        <p className="mobile-body text-muted-foreground">
          마지막 단계예요!
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessNumber" className="text-base font-medium">
            📄 사업자등록번호
          </Label>
          <Input
            id="businessNumber"
            type="text"
            placeholder="123-45-67890"
            value={formData.businessNumber}
            onChange={(e) => setFormData({...formData, businessNumber: e.target.value})}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-base font-medium">
            🏪 상호명
          </Label>
          <Input
            id="businessName"
            type="text"
            placeholder="맛있는 식당"
            value={formData.businessName}
            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType" className="text-base font-medium">
            🍽️ 업종
          </Label>
          <select
            id="businessType"
            value={formData.businessType}
            onChange={(e) => setFormData({...formData, businessType: e.target.value})}
            className="w-full h-12 px-3 rounded-md border border-input bg-background text-base"
          >
            <option value="">업종을 선택해주세요</option>
            <option value="restaurant">일반음식점</option>
            <option value="cafe">카페</option>
            <option value="bakery">베이커리</option>
            <option value="fastfood">패스트푸드</option>
            <option value="pub">술집</option>
            <option value="other">기타</option>
          </select>
        </div>

        <Button
          onClick={handleBusinessInfoSubmit}
          disabled={isLoading}
          className="w-full h-12 text-base font-medium mt-6"
        >
          {isLoading ? "등록 중..." : "인증 및 저장"}
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col px-6">
      {/* Header */}
      <div className="flex items-center py-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="mobile-subtitle">사장님 등록</h1>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          <div className={`w-3 h-3 rounded-full ${currentStep === "phone" ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-3 h-3 rounded-full ${currentStep === "email" ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-3 h-3 rounded-full ${currentStep === "business" ? "bg-primary" : "bg-muted"}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {currentStep === "phone" && renderPhoneStep()}
        {currentStep === "email" && renderEmailStep()}
        {currentStep === "business" && renderBusinessStep()}
      </div>
    </div>
  );
}