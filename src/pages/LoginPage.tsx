import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Store, Mail, Lock, AlertCircle, Phone, Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { FindAccountModal } from "@/components/auth/FindAccountModal";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";

// 관리자 계정 정보
const ADMIN_CREDENTIALS = {
  email: "gksruf8983",
  password: "KimHan*9*3"
};

// 테스트용 인증번호
const TEST_VERIFICATION_CODE = "123456";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 손님용 페이지에서는 항상 라이트 모드 사용
  useEffect(() => {
    // 다크모드 클래스 제거하여 라이트 모드 강제 적용
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [findAccountModalOpen, setFindAccountModalOpen] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminAuthData, setAdminAuthData] = useState({
    phoneNumber: "",
    verificationCode: ""
  });
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user types
    if (loginError) setLoginError("");
  };

  const handleAdminAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminAuthData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (verificationError) setVerificationError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      // 관리자 계정 확인
      if (formData.email === ADMIN_CREDENTIALS.email && formData.password === ADMIN_CREDENTIALS.password) {
        // 관리자 계정이면 2차 인증 폼 표시 (Firebase 인증 없이)
        setShowAdminAuth(true);
        toast({
          title: "관리자 인증 필요",
          description: "핸드폰 본인인증을 진행해주세요.",
        });
        setIsLoading(false);
        return;
      }

      // 일반 로그인 처리 - 관리자 계정이 아닌 경우에만 이메일 형식 검증
      if (formData.email !== ADMIN_CREDENTIALS.email) {
        // 일반 사용자는 이메일 형식이어야 함
        if (!formData.email.includes('@')) {
          setLoginError('올바르지 않은 이메일 형식입니다.');
          toast({
            title: "로그인 실패",
            description: '올바르지 않은 이메일 형식입니다.',
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // 일반 사용자만 Firebase 인증 시도
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 사용자 승인 상태 확인
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // 계정 활성 상태 확인 (가장 먼저 확인)
          if (!userData.isActive) {
            await signOut(auth); // 로그아웃
            setLoginError('계정이 비활성화되었습니다. 관리자에게 문의하세요.');
            toast({
              title: "로그인 불가",
              description: "계정이 비활성화되었습니다. 관리자에게 문의하세요.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          // 승인 상태 확인
          if (userData.approvalStatus === 'pending') {
            await signOut(auth); // 로그아웃
            setLoginError('사업자등록 승인 대기 중입니다. 승인 후 로그인 가능합니다.');
            toast({
              title: "로그인 불가",
              description: "사업자등록 승인 대기 중입니다. 승인 후 다시 시도해주세요.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          if (userData.approvalStatus === 'rejected') {
            await signOut(auth); // 로그아웃
            setLoginError('사업자등록이 거절되었습니다. 관리자에게 문의하세요.');
            toast({
              title: "로그인 불가",
              description: "사업자등록이 거절되었습니다. 관리자에게 문의하세요.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('사용자 정보 확인 오류:', error);
        // 사용자 정보 확인에 실패해도 로그인은 허용 (기존 사용자 보호)
      }

      toast({
        title: "로그인 성공!",
        description: "관리자 대시보드로 이동합니다.",
      });
      navigate("/admin");
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바르지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
      }
      
      setLoginError(errorMessage);
      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = () => {
    if (!adminAuthData.phoneNumber) {
      setVerificationError("핸드폰 번호를 입력해주세요.");
      return;
    }
    
    setVerificationSent(true);
    toast({
      title: "인증번호 발송",
      description: `인증번호 ${TEST_VERIFICATION_CODE}가 발송되었습니다.`,
    });
  };

  const handleVerifyCode = async () => {
    if (!adminAuthData.verificationCode) {
      setVerificationError("인증번호를 입력해주세요.");
      return;
    }

    if (adminAuthData.verificationCode === TEST_VERIFICATION_CODE) {
      // 인증 성공 - 최고 관리자 권한 부여
      try {
        console.log('관리자 인증 성공 - 세션 저장 시작');
        
        // Firestore에 관리자 세션 정보 저장 (선택적)
        const adminSessionData = {
          role: 'super-admin',
          email: ADMIN_CREDENTIALS.email,
          phoneNumber: adminAuthData.phoneNumber,
          verifiedAt: new Date().toISOString(), // 인증 시간 저장
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후 만료
          isActive: true
        };

        console.log('관리자 세션 데이터:', adminSessionData);

        // Firestore에 관리자 세션 저장 (오류가 발생해도 계속 진행)
        try {
          await setDoc(doc(db, 'adminSessions', 'current'), adminSessionData);
          console.log('Firestore 저장 성공');
        } catch (firestoreError) {
          console.log('Firestore 저장 실패 (계속 진행):', firestoreError);
        }

        // 로컬 스토리지에 관리자 세션 정보 저장
        const localSessionData = {
          ...adminSessionData,
          verifiedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        };
        
        localStorage.setItem('orderland-admin-session', JSON.stringify(localSessionData));
        console.log('로컬 스토리지 저장 완료:', localSessionData);

        toast({
          title: "인증 성공!",
          description: "최고 관리자 페이지로 이동합니다.",
        });
        
        console.log('관리자 페이지로 이동 시작');
        // 최고 관리자 페이지로 이동
        navigate("/super-admin");
      } catch (error) {
        console.error('Admin auth error:', error);
        setVerificationError("인증 처리 중 오류가 발생했습니다.");
      }
    } else {
      setVerificationError("인증오류: 인증번호가 올바르지 않습니다.");
    }
  };

  const handleBackToLogin = () => {
    setShowAdminAuth(false);
    setAdminAuthData({ phoneNumber: "", verificationCode: "" });
    setVerificationSent(false);
    setVerificationError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFBF8]">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="pt-8 px-8 pb-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-2">
              <div className="p-3 bg-primary rounded-xl">
                <Store className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">오더랜드</h1>
            <p className="text-muted-foreground text-sm">
              {showAdminAuth ? "관리자 인증" : "로그인"}
            </p>
          </div>

          {/* Error display area */}
          {(loginError || verificationError) && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {showAdminAuth ? verificationError : loginError}
            </div>
          )}

          {!showAdminAuth ? (
            /* 일반 로그인 폼 */
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="이메일"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-11 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="비밀번호"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 h-11 text-base"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-4 bg-success hover:bg-success/90 text-success-foreground text-base"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          ) : (
            /* 관리자 2차 인증 폼 */
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">관리자 인증이 필요합니다</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">핸드폰 번호</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={adminAuthData.phoneNumber}
                    onChange={handleAdminAuthChange}
                    className="pl-10 h-11 text-base"
                    required
                  />
                </div>
              </div>

              <Button
                onClick={handleSendVerification}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-base"
                disabled={verificationSent}
              >
                {verificationSent ? "인증번호 발송됨" : "인증번호 발송"}
              </Button>

              {verificationSent && (
                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-sm font-medium">인증번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      placeholder="인증번호 6자리"
                      value={adminAuthData.verificationCode}
                      onChange={handleAdminAuthChange}
                      className="pl-10 h-11 text-base"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              {verificationSent && (
                <Button
                  onClick={handleVerifyCode}
                  className="w-full h-11 bg-success hover:bg-success/90 text-success-foreground text-base"
                >
                  인증 확인
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleBackToLogin}
                className="w-full h-11 text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                로그인으로 돌아가기
              </Button>
            </div>
          )}

          {/* Additional Navigation Links - 관리자 인증 중에는 숨김 */}
          {!showAdminAuth && (
            <div className="mt-6">
              <div className="text-center mb-4">
                <span className="text-muted-foreground text-sm">아직 계정이 없으신가요? </span>
                <Button
                  variant="link"
                  onClick={() => navigate("/register")}
                  className="p-0 h-auto text-primary text-sm"
                >
                  회원가입
                </Button>
              </div>
              
              <div className="flex justify-center gap-6 text-xs">
                <Button
                  variant="link"
                  className="p-0 h-auto text-muted-foreground hover:text-primary"
                  onClick={() => setFindAccountModalOpen(true)}
                >
                  아이디 찾기 / 비밀번호 재설정
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Find Account Modal */}
      <FindAccountModal 
        open={findAccountModalOpen}
        onOpenChange={setFindAccountModalOpen}
        onLoginRedirect={() => {}}
      />
    </div>
  );
};

export default LoginPage;