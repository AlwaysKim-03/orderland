import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Search, 
  User,
  LogOut,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "firebase/firestore";

interface StaffCall {
  id: string;
  tableNumber: string;
  storeName: string;
  services: string[];
  customRequest: string;
  status: 'pending' | 'confirmed';
  createdAt: any;
  storeId: string;
}

export function AdminHeader() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("맛있는 우리집 식당");
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  const [pendingCallsCount, setPendingCallsCount] = useState(0);

  // 매장명 가져오기
  useEffect(() => {
    const fetchStoreName = async () => {
      try {
        const settingsRef = doc(db, "settings", "store");
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists() && settingsDoc.data().storeName) {
          setStoreName(settingsDoc.data().storeName);
        }
      } catch (error) {
        console.error("매장명 가져오기 오류:", error);
      }
    };

    fetchStoreName();
  }, []);

  // 직원 호출 데이터 실시간 구독
  useEffect(() => {
    const staffCallsQuery = query(
      collection(db, 'staff-calls'),
      where('status', '==', 'pending'),
      where('storeId', '==', 'default')
    );

    const unsubscribeStaffCalls = onSnapshot(staffCallsQuery, (snapshot) => {
      const staffCallsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffCall[];
      
      setStaffCalls(staffCallsData);
      setPendingCallsCount(staffCallsData.length);
    }, (error) => {
      console.error('직원 호출 데이터 로드 오류:', error);
    });

    return () => {
      unsubscribeStaffCalls();
    };
  }, []);

  // 직원 호출 확인 처리
  const handleStaffCallConfirm = async (callId: string) => {
    try {
      await updateDoc(doc(db, 'staff-calls', callId), {
        status: 'confirmed',
        confirmedAt: new Date()
      });
      
      toast({
        title: "호출 확인 완료",
        description: "직원 호출이 확인되었습니다.",
      });
    } catch (error) {
      console.error('직원 호출 확인 실패:', error);
      toast({
        title: "확인 실패",
        description: "호출 확인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = () => {
    navigate("/admin/settings");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
      });
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* <SidebarTrigger className="lg:hidden" /> */}
        
        {/* Store Name and Message */}
        <div className="text-center flex-1 lg:flex-none">
          <h1 className="text-lg font-bold text-foreground">{storeName}</h1>
          <p className="text-sm text-primary font-medium">오늘도 화이팅! 💪</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="주문, 메뉴 검색..." 
            className="pl-10 w-64"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {pendingCallsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-destructive">
                  {pendingCallsCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>직원 호출 알림</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {staffCalls.length === 0 ? (
              <DropdownMenuItem disabled>
                <div className="flex flex-col gap-1 w-full">
                  <p className="text-sm text-muted-foreground">대기 중인 직원 호출이 없습니다</p>
                </div>
              </DropdownMenuItem>
            ) : (
              staffCalls.map((call) => (
                <DropdownMenuItem key={call.id} className="flex items-center justify-between">
                  <div className="flex flex-col gap-1 flex-1">
                    <p className="text-sm font-medium">
                      테이블 {call.tableNumber} 호출
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {call.services.length > 0 && (
                        <p>요청: {call.services.join(', ')}</p>
                      )}
                      {call.customRequest && (
                        <p>기타: {call.customRequest}</p>
                      )}
                      <p>시간: {call.createdAt?.toDate?.()?.toLocaleTimeString() || '방금 전'}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStaffCallConfirm(call.id);
                    }}
                    className="ml-2"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg" alt="프로필" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {storeName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{storeName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>프로필</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>로그아웃</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}