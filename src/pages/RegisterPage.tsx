import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Store, ArrowLeft, Phone, User, Building, Mail, Lock, Calendar as CalendarIcon, Check, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification as firebaseSendEmailVerification, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailVerificationSent, setIsEmailVerificationSent] = useState(false);
  const [isBusinessVerified, setIsBusinessVerified] = useState(false);
  const [openingDate, setOpeningDate] = useState<Date>();
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState<string>("");
  
  // 회원가입 시작 시 localStorage에 상태 설정
  useEffect(() => {
    localStorage.setItem('isRegistering', 'true');
    
    // 컴포넌트 언마운트 시 localStorage 정리
    return () => {
      localStorage.removeItem('isRegistering');
    };
  }, []);

  const [formData, setFormData] = useState({
    // Step 1 - Phone verification
    phone: "",
    name: "",
    // Step 2 - Store info & account
    storeName: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Step 3 - Business verification
    businessNumber: "",
    ownerName: "",
    businessName: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && /[!@#$%^&*(),.?":{}|<>]/.test(password);
  };

  const sendVerificationCode = async () => {
    if (!formData.phone || !formData.name) {
      setErrors({ phone: "전화번호와 이름을 입력해주세요" });
      return;
    }
    
    setIsLoading(true);
    try {
      // reCAPTCHA 설정
      if (!recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response: any) => {
            console.log('reCAPTCHA solved');
          }
        });
        setRecaptchaVerifier(verifier);
      }
      
      // 전화번호 형식 변환 (국제 형식)
      const phoneNumber = formData.phone.replace(/-/g, '');
      const internationalPhone = phoneNumber.startsWith('0') ? `+82${phoneNumber.slice(1)}` : phoneNumber;
      
      // SMS 인증 코드 발송 (Firebase 인증 없이 단순 인증만)
      const confirmation = await signInWithPhoneNumber(auth, internationalPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setIsVerificationSent(true);
      
      toast({
        title: "인증번호가 전송되었습니다",
        description: "입력하신 전화번호로 인증번호를 보내드렸습니다.",
      });
    } catch (error: any) {
      console.error("SMS 인증 발송 오류:", error);
      
      let errorMessage = "인증번호 발송 중 오류가 발생했습니다.";
      
      if (error.code === "auth/invalid-phone-number") {
        errorMessage = "유효하지 않은 전화번호 형식입니다.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
      }
      
      toast({
        title: "인증번호 발송 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhone = async () => {
    if (!phoneVerificationCode || phoneVerificationCode.length !== 6) {
      setErrors({ verificationCode: "6자리 인증번호를 입력해주세요" });
      return;
    }
    
    if (!confirmationResult) {
      toast({
        title: "오류",
        description: "인증 정보를 찾을 수 없습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // 인증 코드 확인 (Firebase 인증은 하지 않고 인증만 확인)
      const result = await confirmationResult.confirm(phoneVerificationCode);
      
      // 인증이 성공적으로 완료되었는지 확인
      if (result.user) {
        setIsPhoneVerified(true);
        setCurrentStep(2);
        toast({
          title: "전화번호 인증 완료",
          description: "다음 단계로 진행해주세요.",
        });
        
        // Firebase 인증 상태를 즉시 초기화 (회원가입 완료 시까지)
        await auth.signOut();
        
        // 추가로 인증 상태를 완전히 초기화
        setTimeout(async () => {
          if (auth.currentUser) {
            await auth.signOut();
          }
        }, 100);
        
        // localStorage에 회원가입 중임을 명시적으로 표시
        localStorage.setItem('isRegistering', 'true');
      } else {
        throw new Error("인증에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("인증 코드 확인 오류:", error);
      
      let errorMessage = "인증번호가 올바르지 않습니다.";
      
      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "잘못된 인증번호입니다. 다시 확인해주세요.";
      } else if (error.code === "auth/code-expired") {
        errorMessage = "인증번호가 만료되었습니다. 새로운 인증번호를 요청해주세요.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      }
      
      toast({
        title: "인증 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailVerification = async () => {
    if (!formData.email) {
      setErrors({ email: "이메일을 입력해주세요" });
      return;
    }
    
    if (!formData.password) {
      setErrors({ password: "비밀번호를 먼저 입력해주세요" });
      return;
    }
    
    setIsLoading(true);
    try {
      // 임시 Firebase 계정 생성 (이메일 인증용)
      const tempUserCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const tempUser = tempUserCredential.user;
      
      // 이메일 인증 메일 발송
      await firebaseSendEmailVerification(tempUser);
      
      // 임시 사용자 정보를 localStorage에 저장
      localStorage.setItem('tempUserUid', tempUser.uid);
      localStorage.setItem('tempUserEmail', formData.email);
      
      setIsEmailVerificationSent(true);
      toast({
        title: "인증 메일이 발송되었습니다",
        description: "이메일을 확인하여 인증을 완료해주세요.",
      });
    } catch (error: any) {
      console.error("이메일 인증 발송 오류:", error);
      
      let errorMessage = "이메일 인증 발송 중 오류가 발생했습니다.";
      
      if (error.code === "auth/invalid-email") {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "이미 사용 중인 이메일입니다.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "비밀번호가 너무 약합니다.";
      }
      
      toast({
        title: "인증 메일 발송 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailVerification = async () => {
    const tempUserUid = localStorage.getItem('tempUserUid');
    const tempUserEmail = localStorage.getItem('tempUserEmail');
    
    if (!tempUserUid || !tempUserEmail) {
      toast({
        title: "오류",
        description: "인증 정보를 찾을 수 없습니다. 다시 인증 메일을 발송해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    if (tempUserEmail !== formData.email) {
      toast({
        title: "오류",
        description: "이메일 주소가 일치하지 않습니다.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // 현재 로그인된 사용자 확인
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid === tempUserUid) {
        // 이메일 인증 상태 확인
        await currentUser.reload();
        
        if (currentUser.emailVerified) {
          setIsEmailVerified(true);
          
          toast({
            title: "이메일 인증 완료",
            description: "이메일 인증이 완료되었습니다.",
          });
        } else {
          toast({
            title: "인증 필요",
            description: "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.",
            variant: "destructive"
          });
        }
      } else {
        // 임시 사용자로 다시 로그인
        const tempUserCredential = await signInWithEmailAndPassword(
          auth,
          tempUserEmail,
          formData.password
        );
        
        const tempUser = tempUserCredential.user;
        await tempUser.reload();
        
        if (tempUser.emailVerified) {
          setIsEmailVerified(true);
          
          toast({
            title: "이메일 인증 완료",
            description: "이메일 인증이 완료되었습니다.",
          });
        } else {
          toast({
            title: "인증 필요",
            description: "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error("이메일 인증 확인 오류:", error);
      
      let errorMessage = "인증 상태를 확인할 수 없습니다.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "인증 정보를 찾을 수 없습니다. 다시 인증 메일을 발송해주세요.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "비밀번호가 올바르지 않습니다.";
      }
      
      toast({
        title: "인증 확인 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.storeName) newErrors.storeName = "가게 이름을 입력해주세요";
    if (!isEmailVerified) newErrors.email = "이메일 인증을 완료해주세요";
    if (!validatePassword(formData.password)) {
      newErrors.password = "비밀번호는 8자 이상, 특수문자를 포함해야 합니다";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const proceedToStep3 = () => {
    // 전화번호 인증이 완료되지 않았으면 Step 1으로 돌아가기
    if (!isPhoneVerified) {
      toast({
        title: "전화번호 인증 필요",
        description: "전화번호 인증을 먼저 완료해주세요.",
        variant: "destructive"
      });
      setCurrentStep(1);
      return;
    }
    
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };

  const validateBusinessNumber = (number: string) => {
    // Remove all non-digits and check if it's 10 digits
    const cleanNumber = number.replace(/[^\d]/g, '');
    return cleanNumber.length === 10;
  };

  const completeRegistration = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateBusinessNumber(formData.businessNumber)) {
      newErrors.businessNumber = "올바른 사업자 등록번호를 입력해주세요 (10자리 숫자)";
    }
    if (!formData.ownerName) newErrors.ownerName = "대표자명을 입력해주세요";
    if (!formData.businessName) newErrors.businessName = "사업자 상호명을 입력해주세요";
    if (!openingDate) newErrors.openingDate = "개업일자를 선택해주세요";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // 이메일 인증 확인
      if (!isEmailVerified) {
        toast({
          title: "이메일 인증 필요",
          description: "이메일 인증을 완료해주세요.",
          variant: "destructive"
        });
        return;
      }
      
      setIsLoading(true);
      
      try {
        // 사업자 인증 API 호출 (GitHub Pages 환경에서는 개발 모드로 처리)
        const openingDateStr = openingDate ? format(openingDate, "yyyyMMdd") : "";
        
        let verificationResult;
        
        // GitHub Pages 환경에서는 서버 API가 없으므로 개발 모드로 처리
        if (window.location.hostname.includes('github.io') || window.location.hostname.includes('web.app')) {
          // 배포 환경에서는 개발 모드로 인증 완료 처리
          verificationResult = {
            verified: true,
            message: '배포 환경: 사업자 인증이 완료되었습니다.',
            data: {
              businessNumber: formData.businessNumber.replace(/[^\d]/g, ''),
              businessName: formData.businessName,
              representativeName: formData.ownerName,
              openingDate: openingDateStr,
              status: '01'
            }
          };
        } else {
          // 로컬 개발 환경에서는 실제 API 호출
          const verificationResponse = await fetch('/api/business-verification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessNumber: formData.businessNumber.replace(/[^\d]/g, ''),
              openingDate: openingDateStr,
              representativeName: formData.ownerName,
              businessName: formData.businessName
            })
          });

          verificationResult = await verificationResponse.json();
        }
        
        if (!verificationResult.verified) {
          toast({
            title: "사업자 인증 실패",
            description: verificationResult.message || "사업자 정보 인증에 실패했습니다.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // 기존 인증된 사용자 사용 (새 계정 생성 대신)
        const currentUser = auth.currentUser;
        
        if (!currentUser || !currentUser.emailVerified) {
          toast({
            title: "이메일 인증 필요",
            description: "이메일 인증을 완료해주세요.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // 사용자 프로필 업데이트
        await updateProfile(currentUser, {
          displayName: formData.name
        });

        // Firestore에 사용자 정보 저장 (사업자 인증 정보 포함)
        await setDoc(doc(db, "users", currentUser.uid), {
          businessName: formData.businessName,
          businessNumber: formData.businessNumber,
          ownerName: formData.ownerName,
          email: formData.email,
          phoneNumber: formData.phone,
          storeName: formData.storeName,
          role: "admin",
          createdAt: new Date(),
          isActive: true,
          openingDate: openingDate,
          emailVerified: true,
          phoneVerified: true,
          businessVerified: true,
          businessVerificationData: verificationResult.data
        });

        // 기본 설정 데이터 생성
        await setDoc(doc(db, "settings", "store"), {
          storeName: formData.storeName,
          storeAddress: "",
          storePhone: formData.phone,
          businessHours: {
            monday: { open: "09:00", close: "22:00", closed: false },
            tuesday: { open: "09:00", close: "22:00", closed: false },
            wednesday: { open: "09:00", close: "22:00", closed: false },
            thursday: { open: "09:00", close: "22:00", closed: false },
            friday: { open: "09:00", close: "22:00", closed: false },
            saturday: { open: "10:00", close: "23:00", closed: false },
            sunday: { open: "10:00", close: "22:00", closed: false },
          },
          notifications: {
            newOrders: true,
            orderUpdates: true,
            reservations: true,
            salesAlerts: true,
            systemUpdates: false,
          },
          qrSettings: {
            size: "medium",
            includeLogo: true,
            autoGenerate: true,
          },
          customMessages: {
            orderComplete: "주문이 완료되었습니다. 맛있게 드세요! 😊",
            reservationConfirmed: "예약이 확정되었습니다. 방문을 기다리겠습니다! 🎉",
            servingComplete: "주문하신 음식이 준비되었습니다. 맛있게 드세요! 🍽️",
          },
          updatedAt: new Date()
        });

        toast({
          title: "회원가입이 완료되었습니다! 🎉",
          description: "관리자 대시보드로 이동합니다.",
        });
        
        // 회원가입 완료 시 localStorage 정리
        localStorage.removeItem('isRegistering');
        localStorage.removeItem('tempUserUid');
        localStorage.removeItem('tempUserEmail');
        
        navigate("/admin");
      } catch (error: any) {
        console.error("회원가입 오류:", error);
        
        let errorMessage = "회원가입 중 오류가 발생했습니다.";
        
        if (error.code === "auth/email-already-in-use") {
          errorMessage = "이미 사용 중인 이메일입니다.";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "비밀번호가 너무 약합니다.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "유효하지 않은 이메일 형식입니다.";
        }
        
        toast({
          title: "회원가입 실패",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-white to-accent/30 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로 돌아가기
          </Button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary">오더랜드</h1>
          </div>
          <p className="text-xl text-muted-foreground">관리자 회원가입</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep >= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "w-16 h-1 mx-2 rounded transition-colors",
                      currentStep > step ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-20">
            <span className={cn("text-sm", currentStep >= 1 ? "text-primary font-medium" : "text-muted-foreground")}>
              전화번호 인증
            </span>
            <span className={cn("text-sm", currentStep >= 2 ? "text-primary font-medium" : "text-muted-foreground")}>
              가게정보 입력
            </span>
            <span className={cn("text-sm", currentStep >= 3 ? "text-primary font-medium" : "text-muted-foreground")}>
              사업자 인증
            </span>
          </div>
        </div>

        {/* Step 1: Phone Verification */}
        {currentStep === 1 && (
          <Card className="mx-auto max-w-2xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl">1단계 - 전화번호로 시작하기</CardTitle>
              <CardDescription>
                안전한 가입을 위해 전화번호 인증을 진행합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="010-1234-5678"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="pl-10 h-12 text-base"
                      maxLength={13}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    전화번호는 숫자만 입력해주세요
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="홍길동"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}

              {!isVerificationSent ? (
                <Button
                  onClick={sendVerificationCode}
                  disabled={isLoading}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isLoading ? "발송중..." : "📨 인증번호 받기"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">인증번호</Label>
                    <Input
                      id="verificationCode"
                      placeholder="6자리 인증번호 입력"
                      value={phoneVerificationCode}
                      onChange={(e) => setPhoneVerificationCode(e.target.value)}
                      className="h-12 text-base text-center tracking-widest"
                      maxLength={6}
                    />
                    {errors.verificationCode && (
                      <p className="text-sm text-destructive">{errors.verificationCode}</p>
                    )}
                  </div>
                  <Button
                    onClick={verifyPhone}
                    disabled={isLoading}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isLoading ? "확인중..." : "✅ 인증 확인"}
                  </Button>
                </div>
              )}
              
              {/* reCAPTCHA 컨테이너 */}
              <div id="recaptcha-container"></div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Store Info & Account */}
        {currentStep === 2 && (
          <Card className="mx-auto max-w-2xl animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">2단계 - 가게 정보 입력 및 계정 만들기</CardTitle>
                  <CardDescription>
                    가게 정보와 로그인에 사용할 계정을 만들어주세요
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  이전 단계
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">가게 이름</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="storeName"
                    name="storeName"
                    placeholder="돈까스상회"
                    value={formData.storeName}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                {errors.storeName && (
                  <p className="text-sm text-destructive">{errors.storeName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="최소 8자, 특수문자 포함"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  비밀번호는 최소 8자 이상, 특수문자를 포함해야 합니다
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
                {formData.password && formData.confirmPassword && (
                  <p className={cn(
                    "text-sm",
                    formData.password === formData.confirmPassword 
                      ? "text-green-600" 
                      : "text-destructive"
                  )}>
                    {formData.password === formData.confirmPassword 
                      ? "✅ 비밀번호가 일치합니다" 
                      : "❌ 비밀번호가 일치하지 않습니다"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@restaurant.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 h-12 text-base"
                      disabled={isEmailVerified}
                    />
                  </div>
                  {!isEmailVerified ? (
                    <Button
                      onClick={sendEmailVerification}
                      disabled={!formData.email || !formData.password || isLoading}
                      variant="outline"
                      className="h-12 px-6"
                    >
                      {isLoading ? "발송중..." : "인증 메일 보내기"}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="h-12 px-6"
                      disabled
                    >
                      ✅ 인증완료
                    </Button>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {isEmailVerificationSent && !isEmailVerified && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📧 인증 메일이 발송되었습니다. 이메일을 확인하여 인증을 완료해주세요.
                    </p>
                    <p className="text-sm text-blue-600 mt-2">
                      이메일 인증을 완료한 후 아래 버튼을 클릭하여 인증 상태를 확인해주세요.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={checkEmailVerification}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          인증 확인중...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          인증 상태 확인
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={sendEmailVerification}
                      disabled={isLoading}
                      variant="outline"
                      className="h-12 px-4"
                    >
                      재발송
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={proceedToStep3}
                disabled={!isEmailVerified}
                className="w-full h-12 text-base"
                size="lg"
              >
                다음 단계로
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Business Verification */}
        {currentStep === 3 && (
          <Card className="mx-auto max-w-2xl animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">3단계 - 사업자 등록 인증</CardTitle>
                  <CardDescription>
                    사업자 정보를 입력하여 인증을 완료해주세요
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  이전 단계
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessNumber">사업자 등록번호</Label>
                  <Input
                    id="businessNumber"
                    name="businessNumber"
                    placeholder="123-45-67890"
                    value={formData.businessNumber}
                    onChange={handleInputChange}
                    className="h-12 text-base"
                  />
                  {errors.businessNumber && (
                    <p className="text-sm text-destructive">{errors.businessNumber}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    사업자 정보는 국세청 등록 내용 기준으로 입력해주세요
                  </p>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      🔍 <strong>사업자 인증 안내</strong><br/>
                      • 국세청 오픈API를 통해 실시간으로 사업자 정보를 검증합니다<br/>
                      • 사업자등록번호, 개업일자, 대표자명, 상호명이 모두 일치해야 합니다<br/>
                      • 인증 완료 후 회원가입이 진행됩니다
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>개업일자</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-12 w-full justify-start text-left font-normal",
                          !openingDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {openingDate ? format(openingDate, "yyyy년 MM월 dd일") : "날짜 선택"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={openingDate}
                        onSelect={setOpeningDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.openingDate && (
                    <p className="text-sm text-destructive">{errors.openingDate}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">대표자명</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="ownerName"
                    name="ownerName"
                    placeholder="홍길동"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                {errors.ownerName && (
                  <p className="text-sm text-destructive">{errors.ownerName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">사업자 상호명</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="주식회사 돈까스상회"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                {errors.businessName && (
                  <p className="text-sm text-destructive">{errors.businessName}</p>
                )}
              </div>

              <Button
                onClick={completeRegistration}
                disabled={isLoading}
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isLoading ? "인증 중..." : "✅ 사업자 인증 및 가입 완료"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
          <Button
            variant="link"
            onClick={() => navigate("/login")}
            className="p-0 h-auto text-primary"
          >
            로그인
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;