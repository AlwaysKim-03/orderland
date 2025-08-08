// 주간/월간 매출 리포트 유틸리티

interface OrderData {
  id: string;
  tableNumber: string;
  storeName: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    image?: string;
    categoryName?: string;
  }>;
  totalAmount: number;
  status: string;
  createdAt: any;
  updatedAt: any;
  storeId: string;
  orderNumber: string;
  customerInfo: {
    tableNumber: string;
    orderTime: string;
    totalItems: number;
  };
  paymentStatus: string;
  orderType: string;
}

interface SalesReport {
  period: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    orders: number;
    sales: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    orders: number;
    sales: number;
  }>;
  paymentBreakdown: Array<{
    method: string;
    orders: number;
    sales: number;
  }>;
}

// 주간 리포트 생성
export const generateWeeklyReport = (orders: OrderData[], reportDate: Date = new Date()): SalesReport => {
  const startOfWeek = new Date(reportDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // 일요일
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6); // 토요일
  endOfWeek.setHours(23, 59, 59, 999);
  
  return generateReport(orders, startOfWeek, endOfWeek, 'weekly');
};

// 월간 리포트 생성
export const generateMonthlyReport = (orders: OrderData[], reportDate: Date = new Date()): SalesReport => {
  const startOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
  const endOfMonth = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return generateReport(orders, startOfMonth, endOfMonth, 'monthly');
};

// 리포트 생성 공통 함수
const generateReport = (orders: OrderData[], startDate: Date, endDate: Date, type: 'weekly' | 'monthly'): SalesReport => {
  // 날짜 범위 필터링
  const filteredOrders = orders.filter(order => {
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });

  // 기본 통계 계산
  const totalOrders = filteredOrders.length;
  const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // 인기 메뉴 계산
  const itemStats = new Map<string, { quantity: number; revenue: number }>();
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const key = item.name;
      if (!itemStats.has(key)) {
        itemStats.set(key, { quantity: 0, revenue: 0 });
      }
      const stats = itemStats.get(key)!;
      stats.quantity += item.quantity;
      stats.revenue += item.price * item.quantity;
    });
  });

  const topItems = Array.from(itemStats.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // 일별 분석
  const dailyStats = new Map<string, { orders: number; sales: number }>();
  filteredOrders.forEach(order => {
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
    const dateKey = orderDate.toISOString().split('T')[0];
    
    if (!dailyStats.has(dateKey)) {
      dailyStats.set(dateKey, { orders: 0, sales: 0 });
    }
    const stats = dailyStats.get(dateKey)!;
    stats.orders += 1;
    stats.sales += order.totalAmount;
  });

  const dailyBreakdown = Array.from(dailyStats.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 카테고리별 분석
  const categoryStats = new Map<string, { orders: number; sales: number }>();
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const category = item.categoryName || '기타';
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { orders: 0, sales: 0 });
      }
      const stats = categoryStats.get(category)!;
      stats.orders += 1;
      stats.sales += item.price * item.quantity;
    });
  });

  const categoryBreakdown = Array.from(categoryStats.entries())
    .map(([category, stats]) => ({ category, ...stats }))
    .sort((a, b) => b.sales - a.sales);

  // 결제 방법별 분석
  const paymentStats = new Map<string, { orders: number; sales: number }>();
  filteredOrders.forEach(order => {
    const paymentMethod = order.paymentStatus || '미결제';
    if (!paymentStats.has(paymentMethod)) {
      paymentStats.set(paymentMethod, { orders: 0, sales: 0 });
    }
    const stats = paymentStats.get(paymentMethod)!;
    stats.orders += 1;
    stats.sales += order.totalAmount;
  });

  const paymentBreakdown = Array.from(paymentStats.entries())
    .map(([method, stats]) => ({ method, ...stats }))
    .sort((a, b) => b.sales - a.sales);

  return {
    period: type === 'weekly' ? '주간' : '월간',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    totalOrders,
    totalSales,
    averageOrderValue,
    topItems,
    dailyBreakdown,
    categoryBreakdown,
    paymentBreakdown
  };
};

// 리포트를 HTML 형식으로 변환
export const generateReportHTML = (report: SalesReport, storeName: string): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${storeName} ${report.period} 매출 리포트</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; }
        .header h1 { color: #333; margin: 0; font-size: 28px; }
        .header p { color: #666; margin: 10px 0 0 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; font-size: 16px; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #007bff; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background-color: #f8f9fa; font-weight: 600; color: #333; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${storeName} ${report.period} 매출 리포트</h1>
          <p>${formatDate(report.startDate)} ~ ${formatDate(report.endDate)}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>총 주문 건수</h3>
            <div class="value">${report.totalOrders.toLocaleString()}건</div>
          </div>
          <div class="summary-card">
            <h3>총 매출</h3>
            <div class="value">${formatCurrency(report.totalSales)}원</div>
          </div>
          <div class="summary-card">
            <h3>평균 주문 금액</h3>
            <div class="value">${formatCurrency(report.averageOrderValue)}원</div>
          </div>
        </div>

        <div class="section">
          <h2>인기 메뉴 TOP 10</h2>
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>메뉴명</th>
                <th>주문 수량</th>
                <th>매출</th>
              </tr>
            </thead>
            <tbody>
              ${report.topItems.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}개</td>
                  <td>${formatCurrency(item.revenue)}원</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>일별 매출 현황</h2>
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>주문 건수</th>
                <th>매출</th>
              </tr>
            </thead>
            <tbody>
              ${report.dailyBreakdown.map(day => `
                <tr>
                  <td>${formatDate(day.date)}</td>
                  <td>${day.orders}건</td>
                  <td>${formatCurrency(day.sales)}원</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>카테고리별 매출</h2>
          <table>
            <thead>
              <tr>
                <th>카테고리</th>
                <th>주문 건수</th>
                <th>매출</th>
              </tr>
            </thead>
            <tbody>
              ${report.categoryBreakdown.map(category => `
                <tr>
                  <td>${category.category}</td>
                  <td>${category.orders}건</td>
                  <td>${formatCurrency(category.sales)}원</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>본 리포트는 자동으로 생성되었습니다. | 생성일시: ${new Date().toLocaleString('ko-KR')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 리포트를 PDF로 변환 (jsPDF 사용)
export const generateReportPDF = async (report: SalesReport, storeName: string): Promise<Blob> => {
  // jsPDF가 설치되어 있지 않으므로 HTML을 Blob으로 반환
  const html = generateReportHTML(report, storeName);
  const blob = new Blob([html], { type: 'text/html' });
  return blob;
};

// 이메일 발송 함수 (실제 구현은 서버에서 처리)
export const sendReportEmail = async (
  email: string, 
  report: SalesReport, 
  storeName: string, 
  reportType: 'weekly' | 'monthly'
): Promise<boolean> => {
  try {
    // 실제 구현에서는 서버 API를 호출하여 이메일 발송
    console.log(`매출 리포트 이메일 발송: ${email}`, {
      storeName,
      reportType,
      period: report.period,
      totalSales: report.totalSales
    });
    
    // 임시로 성공 반환
    return true;
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return false;
  }
}; 