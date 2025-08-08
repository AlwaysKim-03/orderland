import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from './badge';

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  count = 0,
  onClick,
  className = ''
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={onClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {count > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </button>
    </div>
  );
}; 