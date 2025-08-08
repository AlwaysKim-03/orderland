import { useState } from "react";
import { TableGrid, GridSize, TableStatus } from "@/components/order-status/table-grid";
import { OrderDetailSheet } from "@/components/order-status/order-detail-sheet";
import { Bell, User, TrendingUp, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockTables = [
  {
    id: "table-1",
    number: 1,
    status: "occupied" as TableStatus,
    guests: 4,
    orderTime: "14:30",
    orders: ["비빔밥", "된장찌개"]
  },
  {
    id: "table-3",
    number: 3,
    status: "served" as TableStatus,
    guests: 2,
    orderTime: "14:15",
    orders: ["김치찌개"]
  },
  {
    id: "table-7",
    number: 7,
    status: "occupied" as TableStatus,
    guests: 3,
    orderTime: "14:45",
    orders: ["불고기", "밥"]
  }
];

// Mock dashboard data
const mockDashboardData = {
  todaySales: 157000,
  totalOrders: 15,
  topMenus: [
    { name: "돈까스", count: 7 },
    { name: "제로콜라", count: 4 },
    { name: "새우튀김", count: 3 }
  ]
};

const mockOrder = {
  id: "order-1",
  tableNumber: 1,
  guests: 4,
  orderTime: "14:30",
  totalAmount: 42000,
  status: "preparing" as const,
  items: [
    {
      id: "item-1",
      name: "비빔밥",
      quantity: 2,
      price: 12000,
      status: "ready" as const,
      options: ["고추장 많이"]
    },
    {
      id: "item-2", 
      name: "된장찌개",
      quantity: 2,
      price: 9000,
      status: "preparing" as const
    }
  ]
};

export default function OrderStatus() {
  const [currentTables, setCurrentTables] = useState(12); // Start with 4x3 = 12 tables
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Mock store data
  const storeData = {
    name: "돈까스상회",
    type: "한식 / 분식",
    status: "영업중",
    profileImage: null
  };

  const handleTableClick = (table: any) => {
    if (table.status !== "empty") {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setSelectedTable(table);
      setIsSheetOpen(true);
    }
  };

  const handleMarkServed = (orderId: string) => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    toast({
      title: "서빙 완료! 🎉",
      description: "주문이 모두 서빙 완료되었습니다.",
    });
    setIsSheetOpen(false);
  };

  const handleMarkItemServed = (orderId: string, itemId: string) => {
    toast({
      title: "메뉴 서빙 완료 ✅",
      description: "해당 메뉴가 서빙 완료되었습니다.",
    });
  };

  const handleAddTable = () => {
    setCurrentTables(prev => prev + 4); // Add 4 tables (1 row)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    toast({
      title: "테이블 추가 완료! ✨",
      description: "새로운 테이블 4개가 추가되었습니다.",
    });
  };

  const occupiedCount = mockTables.filter(t => t.status === "occupied").length;

  // Generate table slots dynamically based on currentTables
  const tableSlots = Array.from({ length: currentTables }, (_, index) => {
    const tableNumber = index + 1;
    return mockTables.find(t => t.number === tableNumber) || {
      id: `empty-${tableNumber}`,
      number: tableNumber,
      status: "empty" as TableStatus
    };
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top App Header - YouTube Studio Style */}
      <header className="sticky top-0 z-40 bg-[#FFF8F5] border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">오더랜드</h1>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg hover:bg-black/5 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-black/5 transition-colors">
              <Bell className="w-6 h-6 text-muted-foreground" />
            </button>
            <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
              <AvatarImage src={storeData.profileImage || undefined} />
              <AvatarFallback className="text-sm bg-primary/10">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Store Profile Section - Left aligned, smaller */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#FFF8F5] to-background">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16 border-3 border-white shadow-lg">
            <AvatarImage src={storeData.profileImage || undefined} />
            <AvatarFallback className="text-2xl bg-primary/10">
              🏪
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">{storeData.name}</h2>
            <p className="text-sm text-muted-foreground mb-2">
              총 주문 수 {mockDashboardData.totalOrders}건
            </p>
            <Badge variant="secondary" className="bg-success/20 text-success font-medium text-sm">
              {storeData.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Analytics Section - YouTube Studio Style */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">가게 분석</h3>
          <span className="text-sm text-muted-foreground">지난 24시간</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-[#FF914D]/10 to-[#FF914D]/5 border-[#FF914D]/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-[#FF914D]" />
                <div>
                  <p className="text-2xl font-bold text-[#FF914D]">₩{mockDashboardData.todaySales.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">오늘 매출</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#FDC84A]/10 to-[#FDC84A]/5 border-[#FDC84A]/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-[#FDC84A]" />
                <div>
                  <p className="text-2xl font-bold text-[#FDC84A]">{mockDashboardData.totalOrders}건</p>
                  <p className="text-sm text-muted-foreground">총 주문 수</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table Status Section - YouTube Content Style */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">테이블 현황</h3>
          <span className="text-sm text-muted-foreground">
            사용 중: {occupiedCount}/{currentTables}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {tableSlots.map((table) => (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={cn(
                "aspect-square rounded-lg p-3 text-center transition-all duration-200",
                "flex flex-col items-center justify-center text-sm font-medium",
                table.status === "empty" 
                  ? "bg-gray-100 text-gray-600 border border-dashed border-gray-300 hover:bg-gray-200"
                  : table.status === "occupied"
                  ? "bg-red-500 text-white shadow-lg hover:bg-red-600"
                  : "bg-green-500 text-white shadow-lg hover:bg-green-600"
              )}
            >
              <span className="font-bold text-sm mb-1">T-{table.number.toString().padStart(2, '0')}</span>
              {'guests' in table && table.guests && <span className="text-xs">{table.guests}명</span>}
              {'orderTime' in table && table.orderTime && <span className="text-xs">{table.orderTime}</span>}
            </button>
          ))}
        </div>

        {/* 테이블 추가 버튼 */}
        <div className="text-center">
          <Button
            onClick={handleAddTable}
            variant="outline"
            size="lg"
            className="px-6 py-3 border-[#FF914D] text-[#FF914D] hover:bg-[#FF914D]/5 font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            테이블 추가 (4개)
          </Button>
        </div>
      </div>

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        order={mockOrder}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onMarkServed={handleMarkServed}
        onMarkItemServed={handleMarkItemServed}
      />
    </div>
  );
}