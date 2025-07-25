import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useMemo } from 'react';

interface StatisticsCardsProps {
  orders?: any[];
  reservations?: any[];
}

export function StatisticsCards({ orders = [], reservations = [] }: StatisticsCardsProps) {
  const statistics = useMemo(() => {
    // 오늘 날짜 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 오늘 주문 필터링
    const todayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= today;
    });

    // 오늘 매출 계산
    const todayRevenue = todayOrders.reduce((total, order) => {
      let items = [];
      if (order.items && Array.isArray(order.items)) {
        items = order.items;
      } else if (order.orders && Array.isArray(order.orders)) {
        items = order.orders;
      } else if (typeof order.orders === 'string') {
        try {
          items = JSON.parse(order.orders);
        } catch (e) {
          return total;
        }
      }
      
      const orderTotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      return total + orderTotal;
    }, 0);

    // 오늘 예약 수
    const todayReservations = reservations.filter(reservation => {
      const reservationDate = reservation.date?.toDate?.() || new Date(reservation.date);
      return reservationDate >= today;
    }).length;

    // 어제 날짜 계산
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 어제 주문 필터링
    const yesterdayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= yesterday && orderDate < today;
    });

    // 어제 매출 계산
    const yesterdayRevenue = yesterdayOrders.reduce((total, order) => {
      let items = [];
      if (order.items && Array.isArray(order.items)) {
        items = order.items;
      } else if (order.orders && Array.isArray(order.orders)) {
        items = order.orders;
      } else if (typeof order.orders === 'string') {
        try {
          items = JSON.parse(order.orders);
        } catch (e) {
          return total;
        }
      }
      
      const orderTotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      return total + orderTotal;
    }, 0);

    // 변화율 계산
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : '0';
    
    const orderChange = yesterdayOrders.length > 0
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(1)
      : '0';

    return [
      {
        title: "오늘 매출",
        value: `₩${todayRevenue.toLocaleString()}`,
        change: `${revenueChange}%`,
        changeType: parseFloat(revenueChange) >= 0 ? "increase" as const : "decrease" as const,
        icon: DollarSign,
        color: "text-primary"
      },
      {
        title: "오늘 주문 수",
        value: todayOrders.length.toString(),
        change: `${orderChange}%`,
        changeType: parseFloat(orderChange) >= 0 ? "increase" as const : "decrease" as const,
        icon: ShoppingCart,
        color: "text-success"
      },
      {
        title: "오늘 예약 수",
        value: todayReservations.toString(),
        change: "0%",
        changeType: "increase" as const,
        icon: TrendingUp,
        color: "text-warning"
      },
      {
        title: "평균 주문 금액",
        value: todayOrders.length > 0 
          ? `₩${Math.round(todayRevenue / todayOrders.length).toLocaleString()}`
          : "₩0",
        change: "0%",
        changeType: "increase" as const,
        icon: TrendingDown,
        color: "text-destructive"
      }
    ];
  }, [orders, reservations]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statistics.map((stat, index) => (
        <Card key={index} className="stats-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="flex items-center mt-2">
                  {stat.changeType === "increase" ? (
                    <ArrowUp className="w-4 h-4 text-success mr-1" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-destructive mr-1" />
                  )}
                  <p className={`text-xs font-medium ${
                    stat.changeType === "increase" 
                      ? "text-success" 
                      : "text-destructive"
                  }`}>
                    {stat.change} 어제 대비
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}