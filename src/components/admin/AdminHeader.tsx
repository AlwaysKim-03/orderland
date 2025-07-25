import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Search, 
  User,
  LogOut
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
import { doc, getDoc } from "firebase/firestore";

export function AdminHeader() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("맛있는 우리집 식당");

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
              <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs bg-destructive">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>알림</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">새로운 주문이 들어왔습니다</p>
                <p className="text-xs text-muted-foreground">테이블 3 - 김치찌개 1개</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">예약 승인 요청</p>
                <p className="text-xs text-muted-foreground">김철수님 - 내일 오후 7시</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">매출 목표 달성!</p>
                <p className="text-xs text-muted-foreground">오늘 목표 매출을 달성했습니다</p>
              </div>
            </DropdownMenuItem>
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