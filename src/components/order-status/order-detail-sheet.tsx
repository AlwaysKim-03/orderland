import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Clock, Users, Check, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: "pending" | "preparing" | "ready" | "served";
  options?: string[];
}

interface Order {
  id: string;
  tableNumber: number;
  guests: number;
  orderTime: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "preparing" | "ready" | "served";
}

interface OrderDetailSheetProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkServed: (orderId: string) => void;
  onMarkItemServed: (orderId: string, itemId: string) => void;
}

export function OrderDetailSheet({ 
  order, 
  isOpen, 
  onClose, 
  onMarkServed, 
  onMarkItemServed 
}: OrderDetailSheetProps) {
  if (!order) return null;

  const getItemStatusColor = (status: OrderItem["status"]) => {
    switch (status) {
      case "pending": return "bg-warning-light text-warning-foreground";
      case "preparing": return "bg-blue-100 text-blue-700";
      case "ready": return "bg-success-light text-success-foreground";
      case "served": return "bg-muted text-muted-foreground";
    }
  };

  const getItemStatusText = (status: OrderItem["status"]) => {
    switch (status) {
      case "pending": return "주문접수";
      case "preparing": return "조리중";
      case "ready": return "완료";
      case "served": return "서빙완료";
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 transition-all duration-300",
      isOpen ? "visible" : "invisible"
    )}>
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0",
        "bg-background rounded-t-3xl",
        "max-h-[85vh] transition-transform",
        "border-t border-border",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">{order.tableNumber}</span>
            </div>
            <div>
              <h2 className="mobile-title">{order.tableNumber}번 테이블</h2>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{order.guests}명</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{order.orderTime}</span>
                </div>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="mobile-subtitle">{item.name}</h3>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getItemStatusColor(item.status)
                    )}>
                      {getItemStatusText(item.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">수량: {item.quantity}개</span>
                    <span className="font-semibold">
                      {(item.price * item.quantity).toLocaleString()}원
                    </span>
                  </div>
                  {item.options && item.options.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      옵션: {item.options.join(", ")}
                    </div>
                  )}
                </div>
                {item.status !== "served" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMarkItemServed(order.id, item.id)}
                    className="ml-3"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center justify-between mb-4">
            <span className="mobile-subtitle">총 주문금액</span>
            <span className="mobile-title text-primary">
              {order.totalAmount.toLocaleString()}원
            </span>
          </div>
          
          {order.status !== "served" && (
            <Button 
              className="w-full"
              size="lg"
              onClick={() => onMarkServed(order.id)}
            >
              전체 서빙 완료
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}