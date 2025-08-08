import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, ArrowLeft, Phone, User, Building, Mail, Lock, Check, Upload, FileText, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification as sendEmailVerificationFirebase, RecaptchaVerifier, signInWithPhoneNumber, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 손님용 페이지에서는 항상 라이트 모드 사용
  useEffect(() => {
    // 다크모드 클래스 제거하여 라이트 모드 강제 적용
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    
    // 회원가입 중임을 표시
    localStorage.setItem('isRegistering', 'true');
    
    // 컴포넌트 언마운트 시 플래그 제거
    return () => {
      localStorage.removeItem('isRegistering');
    };
  }, []);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    // Step 1 - Phone verification
    phone: "",
    name: "",
    verificationCode: "",
    // Step 2 - Store info & account
    storeName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // reCAPTCHA 초기화
  useEffect(() => {
    if (!recaptchaVerifier && currentStep === 1) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': (response: any) => {
          console.log('reCAPTCHA solved:', response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          toast({
            title: "인증 시간이 만료되었습니다",
            description: "다시 시도해주세요.",
            variant: "destructive",
          });
        }
      });
      setRecaptchaVerifier(verifier);
    }
  }, [recaptchaVerifier, currentStep, toast]);

  // 자동 로그인 방지 (useAuth 훅에서 처리하므로 여기서는 로그아웃 처리 제거)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && currentStep < 3) {
        // 회원가입 중에 자동 로그인이 발생해도 로그아웃하지 않고, useAuth 훅에서 리다이렉트를 방지합니다.
        console.log('회원가입 중 자동 로그인 감지, 리다이렉트 방지는 useAuth에서 처리');
      }
    });

    return () => unsubscribe();
  }, [currentStep]);

  // 이메일 인증 상태 자동 감지
  useEffect(() => {
    const checkEmailVerification = async () => {
      let currentUser = auth.currentUser;
      
      // 사용자가 없으면 이메일/비밀번호로 재로그인 시도
      if (!currentUser && formData.email && formData.password) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );
          currentUser = userCredential.user;
        } catch (error) {
          console.error('자동 감지 재로그인 실패:', error);
          return;
        }
      }
      
      if (currentUser && currentUser.email === formData.email) {
        try {
          await currentUser.reload();
          if (currentUser.emailVerified && !isEmailVerified) {
            console.log('이메일 인증 상태 자동 감지: 완료');
            setIsEmailVerified(true);
            toast({
              title: "이메일 인증 완료",
              description: "이메일 인증이 완료되었습니다.",
            });
          }
        } catch (error) {
          console.error('이메일 인증 상태 확인 오류:', error);
        }
      }
    };

    // 초기 확인
    checkEmailVerification();

    // 주기적 확인 (5초마다, 2분간)
    const interval = setInterval(checkEmailVerification, 5000);
    
    // 2분 후 인터벌 정리
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [formData.email, formData.password, isEmailVerified, toast]);

  // 페이지 포커스 시 이메일 인증 상태 재확인
  useEffect(() => {
    const handleFocus = async () => {
      let currentUser = auth.currentUser;
      
      // 사용자가 없으면 이메일/비밀번호로 재로그인 시도
      if (!currentUser && formData.email && formData.password) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );
          currentUser = userCredential.user;
        } catch (error) {
          console.error('페이지 포커스 재로그인 실패:', error);
          return;
        }
      }
      
      if (currentUser && currentUser.email === formData.email) {
        try {
          await currentUser.reload();
          if (currentUser.emailVerified && !isEmailVerified) {
            console.log('페이지 포커스 시 이메일 인증 감지: 완료');
            setIsEmailVerified(true);
            toast({
              title: "이메일 인증 완료",
              description: "이메일 인증이 완료되었습니다.",
            });
          }
        } catch (error) {
          console.error('페이지 포커스 시 인증 확인 실패:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [formData.email, formData.password, isEmailVerified, toast]);

  // 한국 전화번호를 국제 형식으로 변환
  const convertToInternationalFormat = (phone: string) => {
    const numbers = phone.replace(/[^\d]/g, '');
    
    // 이미 +82로 시작하면 그대로 반환
    if (phone.startsWith('+82')) {
      return phone;
    }
    
    // 010, 011, 016, 017, 018, 019로 시작하는 경우
    if (numbers.startsWith('010') || numbers.startsWith('011') || 
        numbers.startsWith('016') || numbers.startsWith('017') || 
        numbers.startsWith('018') || numbers.startsWith('019')) {
      return `+82${numbers.substring(1)}`; // 첫 번째 0 제거하고 +82 추가
    }
    
    // 02로 시작하는 서울 지역번호
    if (numbers.startsWith('02')) {
      return `+82${numbers}`; // 02 그대로 두고 +82 추가
    }
    
    // 기타 지역번호 (031, 032, 033, 041, 042, 043, 044, 051, 052, 053, 054, 055, 061, 062, 063, 064)
    if (numbers.length >= 2 && numbers.startsWith('0')) {
      return `+82${numbers.substring(1)}`; // 첫 번째 0 제거하고 +82 추가
    }
    
    // 이미 숫자만 있는 경우 (01012345678)
    if (numbers.length === 11 && numbers.startsWith('0')) {
      return `+82${numbers.substring(1)}`;
    }
    
    // 그 외의 경우 원본 반환
    return phone;
  };

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

    if (!recaptchaVerifier) {
      toast({
        title: "인증 준비 중",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 전화번호를 국제 형식으로 변환
      const internationalPhone = convertToInternationalFormat(formData.phone);
      console.log('전화번호 인증 시작:', internationalPhone);
      
      // SMS 인증 코드 발송
      const confirmation = await signInWithPhoneNumber(auth, internationalPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      
      setIsVerificationSent(true);
      toast({
        title: "인증번호가 전송되었습니다",
        description: "입력하신 전화번호로 인증번호를 보내드렸습니다.",
      });
    } catch (error: any) {
      console.error('SMS 인증 오류:', error);
      let errorMessage = '인증번호 발송에 실패했습니다.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = '올바르지 않은 전화번호 형식입니다.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      toast({
        title: "인증번호 발송 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhone = async () => {
    if (formData.verificationCode.length !== 6) {
      setErrors({ verificationCode: "6자리 인증번호를 입력해주세요" });
      return;
    }

    if (!confirmationResult) {
      toast({
        title: "인증 정보가 없습니다",
        description: "인증번호를 다시 발송해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 인증 코드 확인
      const result = await confirmationResult.confirm(formData.verificationCode);
      
      // 전화번호 인증 완료 - 자동 로그인 방지를 위해 즉시 로그아웃
      if (result.user) {
        await signOut(auth);
        console.log('전화번호 인증 완료 후 자동 로그인 방지');
      }
      
      // 전화번호 인증 완료 - 다음 단계로 진행
      setIsPhoneVerified(true);
      setCurrentStep(2);
      
      // reCAPTCHA 리셋
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
      
      toast({
        title: "전화번호 인증 완료",
        description: "다음 단계로 진행해주세요.",
      });
    } catch (error: any) {
      console.error('인증 코드 확인 오류:', error);
      let errorMessage = '인증번호가 올바르지 않습니다.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = '잘못된 인증번호입니다. 다시 확인해주세요.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = '인증번호가 만료되었습니다. 다시 발송해주세요.';
      }
      
      setErrors({ verificationCode: errorMessage });
      toast({
        title: "인증 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailVerificationLocal = async () => {
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
      // 실제 계정 생성 (이메일 인증용)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const user = userCredential.user;
      
      // 이메일 인증 발송
      await sendEmailVerificationFirebase(user);
      
      toast({
        title: "인증 메일이 전송되었습니다",
        description: "이메일을 확인하고 인증을 완료해주세요. 인증 후 '인증 확인' 버튼을 눌러주세요.",
      });
      
    } catch (error: any) {
      console.error('이메일 인증 발송 오류:', error);
      let errorMessage = '이메일 인증 발송에 실패했습니다.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. (최소 6자)';
      }
      
      toast({
        title: "이메일 인증 발송 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeName) newErrors.storeName = "매장명을 입력해주세요";
    if (!formData.email) newErrors.email = "이메일을 입력해주세요";
    if (!formData.password) newErrors.password = "비밀번호를 입력해주세요";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = "비밀번호는 8자 이상이어야 하며 특수문자를 포함해야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const completeAccountStep = () => {
    if (validateStep2()) {
      setCurrentStep(3);
      toast({
        title: "계정 정보 입력 완료",
        description: "마지막 단계로 진행해주세요.",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        // 파일 크기 확인 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "파일 크기 초과",
            description: "파일 크기는 10MB 이하여야 합니다.",
            variant: "destructive",
          });
          return;
        }

        // 파일 형식 확인
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "지원하지 않는 파일 형식",
            description: "JPG, PNG, PDF 파일만 업로드 가능합니다.",
            variant: "destructive",
          });
          return;
        }

        setUploadedFile(file);
        setIsFileUploaded(true);
        toast({
          title: "파일 업로드 준비 완료",
          description: "회원가입 시 서버에 업로드됩니다.",
        });
      } catch (error) {
        console.error('파일 업로드 오류:', error);
        toast({
          title: "파일 업로드 실패",
          description: "파일 업로드 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setIsFileUploaded(false);
  };

  const submitBusinessRegistration = async () => {
    // 모든 필수 정보가 입력되었는지 확인
    if (!formData.name || !formData.email || !formData.password || !formData.storeName) {
      toast({
        title: "필수 정보를 모두 입력해주세요",
        description: "이름, 이메일, 비밀번호, 가게 이름을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 전화번호 인증이 완료되었는지 확인
    if (!isPhoneVerified) {
      toast({
        title: "전화번호 인증이 필요합니다",
        description: "전화번호 인증을 완료해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 이메일 인증이 완료되었는지 확인
    if (!isEmailVerified) {
      toast({
        title: "이메일 인증이 필요합니다",
        description: "이메일 인증을 완료해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('=== 가입 정보 저장 시작 ===');
      console.log('입력된 데이터:', {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        storeName: formData.storeName,
        password: formData.password ? '***' : '없음'
      });
      
      // 현재 로그인된 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: "계정이 생성되지 않았습니다",
          description: "이메일 인증을 먼저 완료해주세요.",
          variant: "destructive",
        });
        return;
      }
      
      // 사용자 프로필 업데이트
      console.log('사용자 프로필 업데이트 시작...');
      await updateProfile(currentUser, {
        displayName: formData.name
      });
      console.log('사용자 프로필 업데이트 완료');
      
      // Firestore에 사용자 정보 저장
      console.log('Firestore 사용자 정보 저장 시작...');
      
      // 사업자등록 파일 업로드
      let businessDocumentUrl = "";
      if (uploadedFile) {
        try {
          console.log('사업자등록 파일 업로드 시작...');
          const fileName = `business-documents/${currentUser.uid}/${uploadedFile.name}`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, uploadedFile);
          businessDocumentUrl = await getDownloadURL(storageRef);
          console.log('사업자등록 파일 업로드 완료:', businessDocumentUrl);
        } catch (uploadError) {
          console.error('사업자등록 파일 업로드 실패:', uploadError);
          toast({
            title: "파일 업로드 실패",
            description: "사업자등록 파일 업로드 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      }
      
      const userData = {
        uid: currentUser.uid,
        name: formData.name,
        email: formData.email,
        phone: convertToInternationalFormat(formData.phone), // 전화번호를 국제 형식으로 변환하여 저장
        storeName: formData.storeName,
        businessVerified: false, // 관리자 승인 대기 상태로 변경
        businessDocument: uploadedFile ? uploadedFile.name : "없음", // 업로드된 파일이 있으면 파일명, 없으면 "없음"
        businessDocumentUrl: businessDocumentUrl, // 파일 다운로드 URL
        createdAt: new Date(),
        role: "admin",
        isActive: false, // 관리자 승인 전까지 비활성 상태
        emailVerified: currentUser.emailVerified,
        phoneVerified: true, // 전화번호 인증 완료 표시
        approvalStatus: "pending" // 승인 상태: pending, approved, rejected
      };
      console.log('저장할 사용자 데이터:', userData);
      
      await setDoc(doc(db, "users", currentUser.uid), userData);
      console.log('Firestore 사용자 정보 저장 완료');
      
      // 기본 설정 데이터 생성
      console.log('Firestore 설정 데이터 저장 시작...');
      const settingsData = {
        storeName: formData.storeName,
        storeAddress: "",
        storePhone: convertToInternationalFormat(formData.phone), // 전화번호를 국제 형식으로 변환하여 저장
        businessHours: {
          monday: { open: "09:00", close: "22:00", closed: false },
          tuesday: { open: "09:00", close: "22:00", closed: false },
          wednesday: { open: "09:00", close: "22:00", closed: false },
          thursday: { open: "09:00", close: "22:00", closed: false },
          friday: { open: "09:00", close: "22:00", closed: false },
          saturday: { open: "10:00", close: "23:00", closed: false },
          sunday: { open: "", close: "", closed: true },
        },
        updatedAt: new Date()
      };
      console.log('저장할 설정 데이터:', settingsData);
      
      await setDoc(doc(db, "settings", "store"), settingsData);
      console.log('Firestore 설정 데이터 저장 완료');
      
      console.log('=== 가입 정보 저장 완료 ===');
      
      // 회원가입 완료 플래그 제거
      localStorage.removeItem('isRegistering');
      
      // 테이블 데이터 초기화 (0개 테이블로 시작)
      localStorage.setItem('orderland-tables', JSON.stringify([]));
      
      toast({
        title: "가입이 완료되었습니다!",
        description: "관리자 페이지로 이동합니다.",
      });
      
      // 관리자 페이지로 이동
      navigate("/admin");
      
    } catch (error: any) {
      console.error('=== 회원가입 오류 ===');
      console.error('오류 코드:', error.code);
      console.error('오류 메시지:', error.message);
      console.error('전체 오류:', error);
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. (최소 6자)';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      toast({
        title: "회원가입 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            {[1, 2].map((step) => (
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
                {step < 2 && (
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
              가게정보 및 계정 입력
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
                <div className="space-y-4">
                  {/* reCAPTCHA 컨테이너 */}
                  <div id="recaptcha-container" className="flex justify-center"></div>
                  
                  <Button
                    onClick={sendVerificationCode}
                    disabled={isLoading}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isLoading ? "발송중..." : "📨 인증번호 받기"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">인증번호</Label>
                    <Input
                      id="verificationCode"
                      placeholder="6자리 인증번호 입력"
                      value={formData.verificationCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, verificationCode: e.target.value }))}
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
              {/* 전화번호 인증 상태 확인 */}
              {!isPhoneVerified && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    전화번호 인증이 필요합니다. 이전 단계로 돌아가서 전화번호 인증을 완료해주세요.
                  </p>
                </div>
              )}
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
                    <div className="flex gap-2">
                      <Button
                        onClick={sendEmailVerificationLocal}
                        disabled={!formData.email || !formData.password || isLoading}
                        variant="outline"
                        className="h-12 px-6"
                      >
                        {isLoading ? "발송중..." : "인증 메일 보내기"}
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            let currentUser = auth.currentUser;
                            
                            // 사용자가 없으면 이메일/비밀번호로 재로그인 시도
                            if (!currentUser && formData.email && formData.password) {
                              console.log('사용자가 없음, 재로그인 시도...');
                              try {
                                const userCredential = await signInWithEmailAndPassword(
                                  auth,
                                  formData.email,
                                  formData.password
                                );
                                currentUser = userCredential.user;
                                console.log('재로그인 성공:', currentUser.uid);
                              } catch (loginError: any) {
                                console.error('재로그인 실패:', loginError);
                                toast({
                                  title: "재로그인 실패",
                                  description: "인증 메일을 다시 발송해주세요.",
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            
                            if (!currentUser) {
                              toast({
                                title: "사용자가 없습니다",
                                description: "인증 메일을 먼저 발송해주세요.",
                                variant: "destructive",
                              });
                              return;
                            }

                            // 사용자 정보 새로고침
                            await currentUser.reload();
                            
                            if (currentUser.emailVerified) {
                              setIsEmailVerified(true);
                              toast({
                                title: "이메일 인증 완료",
                                description: "이메일 인증이 완료되었습니다.",
                              });
                            } else {
                              toast({
                                title: "이메일 인증 필요",
                                description: "이메일을 확인하고 링크를 클릭한 후 다시 확인해주세요.",
                                variant: "destructive",
                              });
                            }
                          } catch (error: any) {
                            console.error('이메일 인증 확인 오류:', error);
                            toast({
                              title: "인증 확인 실패",
                              description: "다시 시도해주세요.",
                              variant: "destructive",
                            });
                          }
                        }}
                        variant="outline"
                        className="h-12 px-6"
                      >
                        인증 확인
                      </Button>
                    </div>
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

              <Button
                onClick={submitBusinessRegistration}
                disabled={!isEmailVerified || !isPhoneVerified}
                className="w-full h-12 text-base"
                size="lg"
              >
                {isLoading ? "회원가입 중..." : "회원가입 완료"}
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