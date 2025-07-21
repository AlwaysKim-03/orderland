import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export function StatisticsCards({ todayOrders = [], totalSales = 0, avgSales = 0 }) {
  // 실제 데이터 기반 통계 계산
  const todaySales = totalSales;
  const todayOrderCount = todayOrders.length;
  const avgOrderValue = avgSales;
  
  // 방문 고객 수 계산 (고유한 테이블 번호 기준)
  const uniqueTables = new Set(todayOrders.map(order => order.tableNumber || order.table)).size;

  const statisticsData = [
    {
      title: "오늘 매출",
      value: `₩${todaySales.toLocaleString()}`,
      change: "+12%",
      changeType: "increase",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "오늘 주문 수",
      value: `${todayOrderCount}`,
      change: "+8%",
      changeType: "increase",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "평균 매출",
      value: `₩${avgOrderValue.toLocaleString()}`,
      change: "+5%",
      changeType: "increase",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "평균 지출",
      value: `₩67,000`,
      change: "-3%",
      changeType: "decrease",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statisticsData.map((stat, index) => (
        <Card 
          key={index} 
          className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                  {stat.changeType === "increase" ? (
                    <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <p className={`text-xs font-medium ${
                    stat.changeType === "increase" 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}>
                    {stat.change} 어제 대비
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 