import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  badge?: number;
}

interface BottomNavProps {
  items: BottomNavItem[];
  onItemClick: (id: string) => void;
  className?: string;
}

export function BottomNav({ items, onItemClick, className }: BottomNavProps) {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-card border-t border-border",
      "px-2 py-2",
      "safe-area-bottom",
      className
    )}>
      <div className="flex justify-around items-center max-w-md mx-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cn(
              "relative flex flex-col items-center justify-center",
              "min-w-[64px] py-2 px-2 rounded-lg",
              "transition-all duration-200",
              "touch-manipulation",
              item.isActive
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <div className="relative">
              <item.icon className={cn(
                "w-6 h-6 transition-transform",
                item.isActive && "scale-110"
              )} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span className={cn(
              "text-xs mt-1 font-medium transition-all",
              item.isActive ? "opacity-100" : "opacity-70"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}