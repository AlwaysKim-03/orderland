import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Store, Mail, Lock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { FindAccountModal } from "@/components/auth/FindAccountModal";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
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
            <p className="text-muted-foreground text-sm">로그인</p>
          </div>

          {/* Error display area */}
          {loginError && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {loginError}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
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

          {/* Additional Navigation Links */}
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