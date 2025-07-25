import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store, ArrowLeft, Mail, Lock, Search, Phone, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { findIdByPhone, findPasswordByEmailAndPhone, validatePhoneNumber, validateEmail } from '../utils/findAccount';

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Find ID/Password 관련 상태
  const [findAccountType, setFindAccountType] = useState<'id' | 'password'>('id');
  const [findAccountData, setFindAccountData] = useState({
    phone: '',
    email: '',
    businessNumber: ''
  });
  const [isFindingAccount, setIsFindingAccount] = useState(false);
  const [findAccountResult, setFindAccountResult] = useState<{
    success: boolean;
    message: string;
    email?: string;
  } | null>(null);
  const [isFindAccountDialogOpen, setIsFindAccountDialogOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast({
        title: "로그인 성공! 🎉",
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
      }
      
      setError(errorMessage);
      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: `${provider} 로그인`,
      description: "소셜 로그인 기능은 준비 중입니다.",
    });
  };

  // Find ID/Password 핸들러 함수들
  const handleFindAccountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFindAccountData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFindId = async () => {
    if (!findAccountData.phone) {
      toast({
        title: "전화번호를 입력해주세요",
        description: "등록된 전화번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(findAccountData.phone)) {
      toast({
        title: "올바른 전화번호 형식이 아닙니다",
        description: "000-0000-0000 형식으로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsFindingAccount(true);
    setFindAccountResult(null);

    try {
      const result = await findIdByPhone(findAccountData.phone);
      setFindAccountResult(result);
      
      if (result.success) {
        toast({
          title: "계정을 찾았습니다",
          description: result.message,
        });
      } else {
        toast({
          title: "계정을 찾을 수 없습니다",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('ID 찾기 오류:', error);
      toast({
        title: "오류가 발생했습니다",
        description: "계정 찾기 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsFindingAccount(false);
    }
  };

  const handleFindPassword = async () => {
    if (!findAccountData.email || !findAccountData.phone) {
      toast({
        title: "정보를 모두 입력해주세요",
        description: "이메일과 전화번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(findAccountData.email)) {
      toast({
        title: "올바른 이메일 형식이 아닙니다",
        description: "올바른 이메일 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(findAccountData.phone)) {
      toast({
        title: "올바른 전화번호 형식이 아닙니다",
        description: "000-0000-0000 형식으로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsFindingAccount(true);
    setFindAccountResult(null);

    try {
      const result = await findPasswordByEmailAndPhone(findAccountData.email, findAccountData.phone);
      setFindAccountResult(result);
      
      if (result.success) {
        toast({
          title: "비밀번호 재설정 이메일 발송",
          description: result.message,
        });
      } else {
        toast({
          title: "계정을 찾을 수 없습니다",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('비밀번호 찾기 오류:', error);
      toast({
        title: "오류가 발생했습니다",
        description: "비밀번호 찾기 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsFindingAccount(false);
    }
  };

  const resetFindAccountForm = () => {
    setFindAccountData({
      phone: '',
      email: '',
      businessNumber: ''
    });
    setFindAccountResult(null);
    setIsFindAccountDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-white to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <p className="text-muted-foreground">
            관리자 계정 또는 소셜 계정으로 로그인하세요
          </p>
        </div>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>
              계정 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full order-button"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  또는
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("카카오")}
                className="w-full btn-bounce bg-yellow-400 text-yellow-900 border-yellow-400 hover:bg-yellow-500"
              >
                <div className="w-5 h-5 mr-2 bg-yellow-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-400">K</span>
                </div>
                카카오로 계속하기
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialLogin("네이버")}
                className="w-full btn-bounce bg-green-500 text-white border-green-500 hover:bg-green-600"
              >
                <div className="w-5 h-5 mr-2 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-500">N</span>
                </div>
                네이버로 계속하기
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">계정이 없으신가요? </span>
              <Button
                variant="link"
                onClick={() => navigate("/register")}
                className="p-0 h-auto text-primary"
              >
                회원가입
              </Button>
            </div>

            {/* Find ID/Password Links */}
            <div className="text-center text-sm space-y-2">
              <div>
                <Button
                  variant="link"
                  onClick={() => {
                    setFindAccountType('id');
                    resetFindAccountForm();
                  }}
                  className="p-0 h-auto text-primary"
                >
                  아이디 찾기
                </Button>
                <span className="text-muted-foreground mx-2">|</span>
                <Button
                  variant="link"
                  onClick={() => {
                    setFindAccountType('password');
                    resetFindAccountForm();
                  }}
                  className="p-0 h-auto text-primary"
                >
                  비밀번호 찾기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Find ID/Password Dialog */}
        <Dialog open={isFindAccountDialogOpen} onOpenChange={() => resetFindAccountForm()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {findAccountType === 'id' ? '아이디 찾기' : '비밀번호 찾기'}
              </DialogTitle>
              <DialogDescription>
                {findAccountType === 'id' 
                  ? '등록된 전화번호로 아이디를 찾을 수 있습니다.'
                  : '등록된 이메일과 전화번호로 비밀번호를 재설정할 수 있습니다.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {findAccountType === 'id' ? (
                /* Find ID Form */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="find-phone">전화번호</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="find-phone"
                        name="phone"
                        type="tel"
                        placeholder="000-0000-0000"
                        value={findAccountData.phone}
                        onChange={handleFindAccountInputChange}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      가입 시 등록한 전화번호를 입력해주세요
                    </p>
                  </div>

                  <Button
                    onClick={handleFindId}
                    disabled={isFindingAccount || !findAccountData.phone}
                    className="w-full"
                  >
                    {isFindingAccount ? "찾는 중..." : "아이디 찾기"}
                  </Button>
                </div>
              ) : (
                /* Find Password Form */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="find-email">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="find-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={findAccountData.email}
                        onChange={handleFindAccountInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="find-password-phone">전화번호</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="find-password-phone"
                        name="phone"
                        type="tel"
                        placeholder="000-0000-0000"
                        value={findAccountData.phone}
                        onChange={handleFindAccountInputChange}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      가입 시 등록한 이메일과 전화번호를 입력해주세요
                    </p>
                  </div>

                  <Button
                    onClick={handleFindPassword}
                    disabled={isFindingAccount || !findAccountData.email || !findAccountData.phone}
                    className="w-full"
                  >
                    {isFindingAccount ? "처리 중..." : "비밀번호 재설정 이메일 발송"}
                  </Button>
                </div>
              )}

              {/* Result Display */}
              {findAccountResult && (
                <div className={`p-4 rounded-md ${
                  findAccountResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      findAccountResult.success ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <span className="text-white text-xs">
                        {findAccountResult.success ? '✓' : '✕'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        findAccountResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {findAccountResult.message}
                      </p>
                      {findAccountResult.success && findAccountResult.email && (
                        <p className="text-xs text-green-600 mt-1">
                          찾은 이메일: {findAccountResult.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Demo Login Info */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              <strong>테스트 계정:</strong> Firebase에 등록된 이메일과 비밀번호로 로그인하세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;