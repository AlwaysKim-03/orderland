import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Calendar,
  Award,
  ChefHat
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/firebase";

interface Order {
  id: string;
  storeName: string;
  tableNumber: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: any;
  updatedAt: any;
}

// 매출 데이터 계산 함수
const calculateSalesData = (orders: Order[], period: string) => {
  const now = new Date();
  let startDate = new Date();
  
  // 기간별 시작 날짜 설정
  switch (period) {
    case "1일":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "3일":
      startDate.setDate(now.getDate() - 3);
      break;
    case "7일":
      startDate.setDate(now.getDate() - 7);
      break;
    case "14일":
      startDate.setDate(now.getDate() - 14);
      break;
    case "30일":
      startDate.setDate(now.getDate() - 30);
      break;
    case "60일":
      startDate.setDate(now.getDate() - 60);
      break;
    case "90일":
      startDate.setDate(now.getDate() - 90);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
  }

  // 해당 기간의 주문만 필터링
  const filteredOrders = orders.filter(order => {
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= now;
  });

  // 매출 계산
  let totalSales = 0;
  const uniqueCustomers = new Set();
  const menuSales: Record<string, { quantity: number; revenue: number }> = {};

  filteredOrders.forEach(order => {
    totalSales += order.totalAmount || 0;
    uniqueCustomers.add(order.tableNumber || 'unknown');

    // 메뉴별 판매량 계산
    order.items?.forEach(item => {
      if (!menuSales[item.name]) {
        menuSales[item.name] = { quantity: 0, revenue: 0 };
      }
      menuSales[item.name].quantity += item.quantity || 1;
      menuSales[item.name].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const orderCount = filteredOrders.length;
  const customerCount = uniqueCustomers.size;

  // 인기 메뉴 TOP 3
  const topMenus = Object.entries(menuSales)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 3)
    .map(([name, data]) => ({
      name,
      sales: data.quantity,
      revenue: data.revenue
    }));

  return {
    totalSales,
    orderCount,
    customerCount,
    avgOrderValue: orderCount > 0 ? Math.round(totalSales / orderCount) : 0,
    topMenus
  };
};

// 기간별 데이터 생성 함수
const generatePeriodData = (orders: Order[], period: string) => {
  const now = new Date();
  let days = 1;
  
  switch (period) {
    case "1일": days = 1; break;
    case "3일": days = 3; break;
    case "7일": days = 7; break;
    case "14일": days = 14; break;
    case "30일": days = 30; break;
    case "60일": days = 60; break;
    case "90일": days = 90; break;
  }

  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 해당 날짜의 주문 필터링
    const dayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= date && orderDate < nextDate;
    });

    const daySales = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const uniqueCustomers = new Set(dayOrders.map(order => order.tableNumber || 'unknown'));

    data.push({
      date: i === 0 ? "오늘" : i === 1 ? "어제" : `${i}일전`,
      sales: daySales,
      orders: dayOrders.length,
      customers: uniqueCustomers.size
    });
  }

  return data;
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

// 시간대별 데이터 생성 함수
const generateHourlyData = (orders: Order[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 오늘 주문만 필터링
  const todayOrders = orders.filter(order => {
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
    return orderDate >= today && orderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
  });

  const hourlyData = [];
  for (let hour = 0; hour < 24; hour += 2) {
    const startHour = hour;
    const endHour = hour + 2;
    const timeRange = `${startHour.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}`;
    
    // 해당 시간대의 주문 필터링
    const hourOrders = todayOrders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      const orderHour = orderDate.getHours();
      return orderHour >= startHour && orderHour < endHour;
    });

    const menuCounts: Record<string, number> = {};
    let totalCustomers = 0;

    hourOrders.forEach(order => {
      totalCustomers++;
      order.items?.forEach(item => {
        if (!menuCounts[item.name]) {
          menuCounts[item.name] = 0;
        }
        menuCounts[item.name] += item.quantity || 1;
      });
    });

    const dataPoint: any = { time: timeRange, customers: totalCustomers };
    
    // 상위 3개 메뉴만 포함
    const topMenus = Object.entries(menuCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    topMenus.forEach(([menuName, count]) => {
      dataPoint[menuName] = count;
    });

    hourlyData.push(dataPoint);
  }

  return hourlyData;
};

// 주간 데이터 생성 함수
const generateWeeklyData = (orders: Order[]) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // 이번 주 월요일
  
  const weeklyData = [];
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    
    // 해당 날짜의 주문 필터링
    const dayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= dayStart && orderDate < dayEnd;
    });

    const totalOrders = dayOrders.length;
    const uniqueCustomers = new Set(dayOrders.map(order => order.tableNumber || 'unknown'));
    const totalSales = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgSpent = uniqueCustomers.size > 0 ? Math.round(totalSales / uniqueCustomers.size) : 0;

    weeklyData.push({
      day: days[i],
      orders: totalOrders,
      customers: uniqueCustomers.size,
      avgSpent,
      highlight: i === 2 || i === 4 || i === 5 // 수, 금, 토 하이라이트
    });
  }

  return weeklyData;
};

export default function AdminSalesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"1일" | "3일" | "7일" | "14일" | "30일" | "60일" | "90일">("7일");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Firebase에서 주문 데이터 가져오기
  useEffect(() => {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('주문 데이터 로드 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 실제 매출 데이터 계산
  const salesData = useMemo(() => {
    return calculateSalesData(orders, selectedPeriod);
  }, [orders, selectedPeriod]);

  // 기간별 데이터 생성
  const periodData = useMemo(() => {
    return generatePeriodData(orders, selectedPeriod);
  }, [orders, selectedPeriod]);

  // 시간대별 데이터 생성
  const hourlyData = useMemo(() => {
    return generateHourlyData(orders);
  }, [orders]);

  // 주간 데이터 생성
  const weeklyData = useMemo(() => {
    return generateWeeklyData(orders);
  }, [orders]);

  const formatCurrency = (value: number) => {
    return `₩${value.toLocaleString()}`;
  };

  const getInsight = () => {
    if (salesData.orderCount === 0) {
      return "아직 주문 데이터가 없습니다. 첫 주문을 기다려보세요!";
    }
    
    const insights = [
      `총 ${salesData.orderCount}건의 주문이 있었습니다.`,
      `평균 주문 금액은 ${formatCurrency(salesData.avgOrderValue)}입니다.`,
      salesData.topMenus.length > 0 ? `${salesData.topMenus[0].name}이 가장 인기 메뉴입니다.` : "인기 메뉴 데이터를 확인해보세요.",
      `총 ${salesData.customerCount}명의 고객이 방문했습니다.`
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">매출 데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">매출 정보</h1>
          <p className="text-muted-foreground mt-2">매출 데이터와 고객 분석을 확인하세요</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘의 총 매출</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesData.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> 어제 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 방문 고객</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesData.customerCount}명</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> 어제 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">주문 수</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesData.orderCount}건</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5%</span> 어제 대비
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 객단가</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(salesData.avgOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+3%</span> 어제 대비
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Menus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              인기 메뉴 TOP 3
            </CardTitle>
            <div className="text-sm text-muted-foreground">오늘 가장 많이 주문된 메뉴</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {salesData.topMenus.map((menu, index) => (
                <div key={menu.name} className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    'bg-orange-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{menu.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {menu.sales}개 주문 • {formatCurrency(menu.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Period-based Charts */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  기간별 매출 분석
                </CardTitle>
                <div className="text-sm text-muted-foreground">기간을 선택하여 매출 추이를 확인하세요</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["1일", "3일", "7일", "14일", "30일", "60일", "90일"].map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod(period as "1일" | "3일" | "7일" | "14일" | "30일" | "60일" | "90일")}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sales" className="space-y-4">
              <TabsList>
                <TabsTrigger value="sales">매출</TabsTrigger>
                <TabsTrigger value="orders">주문 수</TabsTrigger>
                <TabsTrigger value="customers">방문 고객</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sales" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "매출"]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="orders" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value}건`, "주문 수"]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="customers" className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={periodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value}명`, "방문 고객"]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Hourly Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              시간대별 주문 분석
            </CardTitle>
            <div className="text-sm text-muted-foreground">2시간 단위로 메뉴별 주문량과 방문 고객 수</div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="orders" />
                  <YAxis yAxisId="customers" orientation="right" />
                  <Tooltip 
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar yAxisId="orders" dataKey="김치찌개" stackId="a" fill={COLORS[0]} />
                  <Bar yAxisId="orders" dataKey="불고기" stackId="a" fill={COLORS[1]} />
                  <Bar yAxisId="orders" dataKey="된장찌개" stackId="a" fill={COLORS[2]} />
                  <Line 
                    yAxisId="customers" 
                    type="monotone" 
                    dataKey="customers" 
                    stroke="#ff7300" 
                    strokeWidth={3}
                    dot={{ fill: "#ff7300", strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Pattern Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              요일별 주문 패턴
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                요일별 주문량과 방문 고객 수 분석
              </div>
              <Badge variant="secondary">
                💡 {getInsight()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="h-80">
                <h4 className="text-sm font-medium mb-4">요일별 주문량</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value}건`, "주문 수"]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="orders">
                      {weeklyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.highlight ? '#ff7300' : 'hsl(var(--primary))'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Stats */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">요일별 상세 분석</h4>
                <div className="space-y-3">
                  {weeklyData.map((day) => (
                    <div 
                      key={day.day} 
                      className={`p-4 rounded-lg border ${
                        day.highlight ? 'bg-orange-50 border-orange-200' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{day.day}요일</span>
                        {day.highlight && <Badge variant="secondary">주목</Badge>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">주문:</span>
                          <span className="ml-1 font-medium">{day.orders}건</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">방문:</span>
                          <span className="ml-1 font-medium">{day.customers}명</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">객단가:</span>
                          <span className="ml-1 font-medium">₩{day.avgSpent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}