import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, ShoppingBag, Trophy } from "lucide-react";

interface SummaryCardsProps {
  todaySales: number;
  totalOrders: number;
  topMenus: Array<{ name: string; count: number }>;
  className?: string;
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="font-bold text-xl">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export function SummaryCards({ todaySales, totalOrders, topMenus, className }: SummaryCardsProps) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {/* 오늘 매출 */}
        <div className="flex-shrink-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-4 min-w-[140px]">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 opacity-90" />
            <div className="w-2 h-2 bg-primary-foreground/30 rounded-full animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="text-xs opacity-75">오늘 매출</div>
            <AnimatedNumber value={todaySales} prefix="₩" />
          </div>
        </div>

        {/* 총 주문 수 */}
        <div className="flex-shrink-0 bg-gradient-to-br from-warning to-warning/80 text-warning-foreground rounded-xl p-4 min-w-[140px]">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-5 h-5 opacity-90" />
            <div className="w-2 h-2 bg-warning-foreground/30 rounded-full animate-pulse delay-100" />
          </div>
          <div className="space-y-1">
            <div className="text-xs opacity-75">총 주문</div>
            <AnimatedNumber value={totalOrders} suffix="건" />
          </div>
        </div>

        {/* 인기 메뉴 TOP3 */}
        <div className="flex-shrink-0 bg-gradient-to-br from-success to-success/80 text-success-foreground rounded-xl p-4 min-w-[160px]">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-5 h-5 opacity-90" />
            <div className="w-2 h-2 bg-success-foreground/30 rounded-full animate-pulse delay-200" />
          </div>
          <div className="space-y-1">
            <div className="text-xs opacity-75">인기 메뉴 TOP3</div>
            <div className="space-y-0.5">
              {topMenus.slice(0, 3).map((menu, index) => (
                <div key={menu.name} className="flex justify-between items-center text-sm">
                  <span className="truncate flex-1">{menu.name}</span>
                  <span className="font-semibold ml-2">({menu.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}