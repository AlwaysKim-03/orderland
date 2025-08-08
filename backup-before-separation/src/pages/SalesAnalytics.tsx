import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Users, Clock, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const SalesAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7일");
  const [hideStoppedMenus, setHideStoppedMenus] = useState(false);
  
  // Mock data
  const todayKPI = {
    sales: 1250000,
    visitors: 45,
    avgOrder: 27778,
    salesChange: 15.2,
    visitorsChange: -5.1,
    avgOrderChange: 21.3
  };

  const salesTrendData = [
    { date: "11/18", sales: 980000 },
    { date: "11/19", sales: 1120000 },
    { date: "11/20", sales: 950000 },
    { date: "11/21", sales: 1340000 },
    { date: "11/22", sales: 1150000 },
    { date: "11/23", sales: 1420000 },
    { date: "11/24", sales: 1250000 }
  ];

  const topMenus = [
    { name: "돈까스 정식", quantity: 28, sales: 392000, share: 31.4, color: "#FF914D" },
    { name: "치킨까스", quantity: 22, sales: 264000, share: 21.1, color: "#FDC84A" },
    { name: "생선까스", quantity: 18, sales: 216000, share: 17.3, color: "#87CEEB" },
    { name: "새우까스", quantity: 15, sales: 225000, share: 18.0, color: "#98D8C8" },
    { name: "치즈까스", quantity: 12, sales: 156000, share: 12.5, color: "#FFB6C1" }
  ];

  const hourlyData = [
    { time: "10-12시", orders: 8, sales: 224000 },
    { time: "12-14시", orders: 23, sales: 644000 },
    { time: "14-16시", orders: 12, sales: 336000 },
    { time: "16-18시", orders: 7, sales: 196000 },
    { time: "18-20시", orders: 18, sales: 504000 },
    { time: "20-22시", orders: 9, sales: 252000 }
  ];

  const weeklyPattern = [
    { day: "월", "10-12": 120, "12-14": 340, "14-16": 180, "16-18": 90, "18-20": 280, "20-22": 150 },
    { day: "화", "10-12": 150, "12-14": 380, "14-16": 200, "16-18": 110, "18-20": 320, "20-22": 180 },
    { day: "수", "10-12": 180, "12-14": 420, "14-16": 240, "16-18": 140, "18-20": 380, "20-22": 220 },
    { day: "목", "10-12": 200, "12-14": 480, "14-16": 280, "16-18": 160, "18-20": 420, "20-22": 250 },
    { day: "금", "10-12": 250, "12-14": 520, "14-16": 300, "16-18": 180, "18-20": 480, "20-22": 300 },
    { day: "토", "10-12": 180, "12-14": 460, "14-16": 320, "16-18": 220, "18-20": 440, "20-22": 280 },
    { day: "일", "10-12": 160, "12-14": 400, "14-16": 260, "16-18": 190, "18-20": 380, "20-22": 240 }
  ];

  const periods = ["1일", "3일", "7일", "14일", "30일", "60일", "90일"];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-blue-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? <TrendingUp className="w-4 h-4" /> : change < 0 ? <TrendingDown className="w-4 h-4" /> : null;
  };

  const getHeatMapColor = (value: number) => {
    const max = 520;
    const intensity = value / max;
    if (intensity > 0.8) return 'bg-primary';
    if (intensity > 0.6) return 'bg-primary/80';
    if (intensity > 0.4) return 'bg-primary/60';
    if (intensity > 0.2) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">매출 분석</h1>
        </div>
      </header>

      <div className="p-4">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="summary" className="text-xs">요약</TabsTrigger>
            <TabsTrigger value="trend" className="text-xs">매출</TabsTrigger>
            <TabsTrigger value="menu" className="text-xs">메뉴</TabsTrigger>
            <TabsTrigger value="time" className="text-xs">시간대</TabsTrigger>
            <TabsTrigger value="pattern" className="text-xs">요일</TabsTrigger>
          </TabsList>

          {/* 요약 보기 탭 */}
          <TabsContent value="summary" className="space-y-4">
            {/* 기간 필터 */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {periods.map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="whitespace-nowrap"
                >
                  {period}
                </Button>
              ))}
            </div>

            {/* KPI 카드 */}
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>오늘의 매출</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(todayKPI.sales)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(todayKPI.salesChange)}`}>
                    {getChangeIcon(todayKPI.salesChange)}
                    어제 대비 {Math.abs(todayKPI.salesChange)}%
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      방문자 수
                    </CardDescription>
                    <CardTitle>{todayKPI.visitors}명</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`flex items-center gap-1 text-sm ${getChangeColor(todayKPI.visitorsChange)}`}>
                      {getChangeIcon(todayKPI.visitorsChange)}
                      {Math.abs(todayKPI.visitorsChange)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      객단가
                    </CardDescription>
                    <CardTitle>{formatCurrency(todayKPI.avgOrder)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`flex items-center gap-1 text-sm ${getChangeColor(todayKPI.avgOrderChange)}`}>
                      {getChangeIcon(todayKPI.avgOrderChange)}
                      {Math.abs(todayKPI.avgOrderChange)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 인사이트 섹션 */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">인기 메뉴 TOP3</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topMenus.slice(0, 3).map((menu, index) => (
                      <div key={menu.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`} 
                               style={{ backgroundColor: menu.color }}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{menu.name}</p>
                            <p className="text-sm text-muted-foreground">{menu.quantity}개 판매</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(menu.sales)}</p>
                          <p className="text-sm text-muted-foreground">{menu.share}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    피크 시간대
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-primary mb-2">오후 12-2시</div>
                    <p className="text-muted-foreground">가장 바쁜 시간대입니다</p>
                    <Badge variant="secondary" className="mt-2">23건 주문</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 매출 추이 탭 */}
          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>최근 7일 매출 추이</CardTitle>
                <CardDescription>일별 매출 변화를 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#FF914D" 
                        strokeWidth={3}
                        dot={{ fill: "#FF914D", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 인기 메뉴 탭 */}
          <TabsContent value="menu" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">메뉴별 판매 성과</h3>
              <div className="flex items-center gap-2">
                <Switch checked={hideStoppedMenus} onCheckedChange={setHideStoppedMenus} />
                <span className="text-sm">판매중지 숨기기</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>매출 점유율</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topMenus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="share"
                      >
                        {topMenus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {topMenus.map((menu, index) => (
                <Card key={menu.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                             style={{ backgroundColor: menu.color }}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{menu.name}</p>
                          <p className="text-sm text-muted-foreground">{menu.quantity}개</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(menu.sales)}</p>
                        <p className="text-sm text-muted-foreground">{menu.share}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 시간대 분석 탭 */}
          <TabsContent value="time" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>시간대별 주문 현황</CardTitle>
                <CardDescription>2시간 단위로 구분된 주문 패턴</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="orders" fill="#FF914D" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {hourlyData.map((slot) => (
                <Card key={slot.time}>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">{slot.time}</div>
                      <div className="text-xl font-bold">{slot.orders}건</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(slot.sales)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 요일 패턴 탭 */}
          <TabsContent value="pattern" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  주간 매출 히트맵
                </CardTitle>
                <CardDescription>요일별, 시간대별 매출 패턴을 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                    {["시간", "월", "화", "수", "목", "금", "토", "일"].map((day, index) => (
                      <div key={day} className={`p-2 font-medium ${index === 0 ? 'text-muted-foreground' : ''}`}>
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {["10-12", "12-14", "14-16", "16-18", "18-20", "20-22"].map((timeSlot) => (
                    <div key={timeSlot} className="grid grid-cols-7 gap-1">
                      <div className="p-2 text-xs text-muted-foreground text-center">{timeSlot}</div>
                      {weeklyPattern.map((day) => (
                        <div
                          key={`${day.day}-${timeSlot}`}
                          className={`p-2 rounded text-center text-xs text-white font-medium ${getHeatMapColor(day[timeSlot as keyof typeof day] as number)}`}
                        >
                          {(day[timeSlot as keyof typeof day] as number).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <span>낮음</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-primary/20 rounded"></div>
                    <div className="w-3 h-3 bg-primary/40 rounded"></div>
                    <div className="w-3 h-3 bg-primary/60 rounded"></div>
                    <div className="w-3 h-3 bg-primary/80 rounded"></div>
                    <div className="w-3 h-3 bg-primary rounded"></div>
                  </div>
                  <span>높음</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SalesAnalytics;