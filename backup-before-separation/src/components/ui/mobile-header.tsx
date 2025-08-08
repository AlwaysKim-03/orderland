import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function MobileHeader({
  title,
  subtitle,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onLeftClick,
  onRightClick,
  className,
  children
}: MobileHeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40",
      "bg-background/95 backdrop-blur-sm",
      "border-b border-border",
      "px-4 py-3",
      "safe-area-top",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {LeftIcon && (
            <button
              onClick={onLeftClick}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors touch-manipulation"
            >
              <LeftIcon className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="mobile-title text-foreground">{title}</h1>
            {subtitle && (
              <p className="mobile-caption">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {children}
          {RightIcon && (
            <button
              onClick={onRightClick}
              className="p-2 rounded-lg hover:bg-muted transition-colors touch-manipulation"
            >
              <RightIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}