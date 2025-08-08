import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";

interface FindAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginRedirect: () => void;
}

export function FindAccountModal({ open, onOpenChange, onLoginRedirect }: FindAccountModalProps) {
  const { toast } = useToast();
  const [findType, setFindType] = useState<'id' | 'password'>('id');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
  });

  // 전화번호 형식 변환 함수
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

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
    
    if (name === 'phone') {
      // 전화번호 입력 시 한국 형식으로 포맷팅
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFindId = async () => {
    if (!formData.phone) {
      toast({
        title: "전화번호를 입력해주세요",
        description: "등록된 전화번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 전화번호를 국제 형식으로 변환
      const internationalPhone = convertToInternationalFormat(formData.phone);
      console.log('=== 아이디 찾기 디버깅 ===');
      console.log('입력된 전화번호:', formData.phone);
      console.log('변환된 국제 전화번호:', internationalPhone);
      
      // Firestore에서 전화번호로 사용자 찾기 (국제 형식으로)
      const usersRef = collection(db, "users");
      console.log('Firestore users 컬렉션 참조 생성됨');
      
      const q = query(usersRef, where("phone", "==", internationalPhone));
      console.log('쿼리 생성됨:', q);
      
      const querySnapshot = await getDocs(q);
      console.log('쿼리 결과:', querySnapshot.docs.length, '개 문서');
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        console.log('찾은 사용자 데이터:', userData);
        
        toast({
          title: "아이디 찾기 완료",
          description: `등록된 이메일: ${userData.email}`,
        });
      } else {
        console.log('국제 형식으로 찾지 못함, 원본 형식으로 시도...');
        // 국제 형식으로도 찾지 못한 경우, 원본 형식으로도 시도
        const q2 = query(usersRef, where("phone", "==", formData.phone));
        const querySnapshot2 = await getDocs(q2);
        console.log('원본 형식 쿼리 결과:', querySnapshot2.docs.length, '개 문서');
        
        if (!querySnapshot2.empty) {
          const userDoc = querySnapshot2.docs[0];
          const userData = userDoc.data();
          console.log('원본 형식으로 찾은 사용자 데이터:', userData);
          
          toast({
            title: "아이디 찾기 완료",
            description: `등록된 이메일: ${userData.email}`,
          });
        } else {
          console.log('모든 형식으로 찾지 못함');
          // 모든 사용자 데이터를 확인해보기
          const allUsersQuery = query(usersRef);
          const allUsersSnapshot = await getDocs(allUsersQuery);
          console.log('전체 사용자 수:', allUsersSnapshot.docs.length);
          allUsersSnapshot.docs.forEach((doc, index) => {
            console.log(`사용자 ${index + 1}:`, doc.data());
          });
          
          toast({
            title: "계정을 찾을 수 없습니다",
            description: "등록된 전화번호가 없습니다. 전화번호 형식을 확인해주세요.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('아이디 찾기 오류:', error);
      toast({
        title: "오류가 발생했습니다",
        description: "아이디 찾기 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  const handleFindPassword = async () => {
    if (!formData.email || !formData.phone) {
      toast({
        title: "정보를 모두 입력해주세요",
        description: "이메일과 전화번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 전화번호를 국제 형식으로 변환
      const internationalPhone = convertToInternationalFormat(formData.phone);
      console.log('입력된 전화번호:', formData.phone);
      console.log('변환된 국제 전화번호:', internationalPhone);
      
      // Firestore에서 이메일과 전화번호로 사용자 확인 (국제 형식으로)
      const usersRef = collection(db, "users");
      const q = query(
        usersRef, 
        where("email", "==", formData.email),
        where("phone", "==", internationalPhone)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Firebase Auth로 비밀번호 재설정 이메일 발송
        await sendPasswordResetEmail(auth, formData.email);
        
        toast({
          title: "비밀번호 재설정 이메일 발송",
          description: "등록된 이메일로 비밀번호 재설정 링크를 발송했습니다.",
        });
      } else {
        // 국제 형식으로도 찾지 못한 경우, 원본 형식으로도 시도
        const q2 = query(
          usersRef, 
          where("email", "==", formData.email),
          where("phone", "==", formData.phone)
        );
        const querySnapshot2 = await getDocs(q2);
        
        if (!querySnapshot2.empty) {
          await sendPasswordResetEmail(auth, formData.email);
          
          toast({
            title: "비밀번호 재설정 이메일 발송",
            description: "등록된 이메일로 비밀번호 재설정 링크를 발송했습니다.",
          });
        } else {
          toast({
            title: "계정을 찾을 수 없습니다",
            description: "등록된 이메일과 전화번호가 일치하지 않습니다.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('비밀번호 찾기 오류:', error);
      let errorMessage = "비밀번호 찾기 중 오류가 발생했습니다.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "등록되지 않은 이메일입니다.";
      }
      
      toast({
        title: "오류가 발생했습니다",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>계정 찾기</DialogTitle>
          <DialogDescription>
            아이디 또는 비밀번호를 찾을 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 탭 버튼 */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={findType === 'id' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFindType('id')}
              className="flex-1"
            >
              아이디 찾기
            </Button>
            <Button
              variant={findType === 'password' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFindType('password')}
              className="flex-1"
            >
              비밀번호 찾기
            </Button>
          </div>

          {findType === 'id' ? (
            /* 아이디 찾기 폼 */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="find-phone">전화번호</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="find-phone"
                    name="phone"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  가입 시 등록한 전화번호를 입력해주세요
                </p>
              </div>

              <Button
                onClick={handleFindId}
                disabled={isLoading || !formData.phone}
                className="w-full"
              >
                {isLoading ? "처리 중..." : "아이디 찾기"}
              </Button>
            </div>
          ) : (
            /* 비밀번호 찾기 폼 */
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
                    value={formData.email}
                    onChange={handleInputChange}
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
                    placeholder="010-1234-5678"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  가입 시 등록한 이메일과 전화번호를 입력해주세요
                </p>
              </div>

              <Button
                onClick={handleFindPassword}
                disabled={isLoading || !formData.email || !formData.phone}
                className="w-full"
              >
                {isLoading ? "처리 중..." : "비밀번호 재설정 이메일 발송"}
              </Button>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">찾으신 정보가 있으시면</p>
                <p className="text-xs mt-1">
                  로그인 페이지에서 정상적으로 로그인하실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 