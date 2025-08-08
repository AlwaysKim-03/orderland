import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChefHat, UserCheck } from "lucide-react";

interface UserTypeSelectionProps {
  onOwnerSelect: () => void;
  onOrderStatus: () => void;
}

export function UserTypeSelection({ onOwnerSelect, onOrderStatus }: UserTypeSelectionProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="mobile-title mb-3">오더랜드에 오신 것을 환영합니다!</h1>
        <p className="mobile-body text-muted-foreground">
          어떤 서비스를 이용하시나요?
        </p>
      </div>

      {/* User Type Cards */}
      <div className="w-full max-w-sm space-y-4">
        {/* Owner Card */}
        <Card 
          className="p-6 cursor-pointer hover-scale transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50"
          onClick={onOwnerSelect}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <h3 className="mobile-subtitle mb-2">🧑‍🍳 사장님용</h3>
            <p className="mobile-caption text-muted-foreground leading-relaxed">
              사장님이신가요?<br />
              지금 바로 스마트한 주문 관리를 시작하세요!
            </p>
          </div>
        </Card>

        {/* Order Status Card */}
        <Card 
          className="p-6 cursor-pointer hover-scale transition-all duration-200 hover:shadow-lg border-2 hover:border-primary/50"
          onClick={onOrderStatus}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <UserCheck className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="mobile-subtitle mb-2">📋 주문 현황</h3>
            <p className="mobile-caption text-muted-foreground leading-relaxed">
              바로 주문 현황을<br />
              확인하고 관리하세요!
            </p>
          </div>
        </Card>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center">
        <p className="text-xs text-muted-foreground">
          언제든지 다른 모드로 전환할 수 있어요
        </p>
      </div>
    </div>
  );
}