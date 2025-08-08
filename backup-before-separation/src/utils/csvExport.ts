// 매출 데이터 CSV 다운로드 유틸리티

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

interface SalesData {
  date: string;
  orderCount: number;
  totalSales: number;
  averageOrderValue: number;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

// CSV 헤더 생성
const generateCSVHeader = (type: 'orders' | 'sales'): string => {
  if (type === 'orders') {
    return '주문번호,테이블번호,메뉴명,수량,단가,총액,주문시간,상태,결제상태\n';
  } else {
    return '날짜,주문건수,총매출,평균주문금액,인기메뉴1,인기메뉴2,인기메뉴3\n';
  }
};

// 주문 데이터를 CSV 형식으로 변환
const convertOrdersToCSV = (orders: OrderData[]): string => {
  let csv = generateCSVHeader('orders');
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const row = [
        order.orderNumber,
        order.tableNumber,
        `"${item.name}"`, // 메뉴명에 쉼표가 있을 수 있으므로 따옴표로 감싸기
        item.quantity,
        item.price,
        item.price * item.quantity,
        order.customerInfo?.orderTime || '',
        order.status,
        order.paymentStatus
      ].join(',');
      
      csv += row + '\n';
    });
  });
  
  return csv;
};

// 매출 데이터를 CSV 형식으로 변환
const convertSalesToCSV = (salesData: SalesData[]): string => {
  let csv = generateCSVHeader('sales');
  
  salesData.forEach(data => {
    const topItems = data.topItems.slice(0, 3).map(item => item.name).join('|');
    const row = [
      data.date,
      data.orderCount,
      data.totalSales,
      data.averageOrderValue,
      `"${topItems}"`
    ].join(',');
    
    csv += row + '\n';
  });
  
  return csv;
};

// 날짜 범위별 주문 데이터 필터링
const filterOrdersByDateRange = (orders: OrderData[], startDate: Date, endDate: Date): OrderData[] => {
  return orders.filter(order => {
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });
};

// 일별 매출 데이터 집계
const aggregateSalesByDate = (orders: OrderData[]): SalesData[] => {
  const salesMap = new Map<string, {
    orderCount: number;
    totalSales: number;
    items: Map<string, { quantity: number; revenue: number }>;
  }>();

  orders.forEach(order => {
    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
    const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    if (!salesMap.has(dateKey)) {
      salesMap.set(dateKey, {
        orderCount: 0,
        totalSales: 0,
        items: new Map()
      });
    }
    
    const dayData = salesMap.get(dateKey)!;
    dayData.orderCount += 1;
    dayData.totalSales += order.totalAmount;
    
    // 메뉴별 집계
    order.items.forEach(item => {
      const itemKey = item.name;
      if (!dayData.items.has(itemKey)) {
        dayData.items.set(itemKey, { quantity: 0, revenue: 0 });
      }
      
      const itemData = dayData.items.get(itemKey)!;
      itemData.quantity += item.quantity;
      itemData.revenue += item.price * item.quantity;
    });
  });

  // Map을 배열로 변환하고 정렬
  return Array.from(salesMap.entries()).map(([date, data]) => {
    const topItems = Array.from(data.items.entries())
      .map(([name, itemData]) => ({
        name,
        quantity: itemData.quantity,
        revenue: itemData.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    return {
      date,
      orderCount: data.orderCount,
      totalSales: data.totalSales,
      averageOrderValue: Math.round(data.totalSales / data.orderCount),
      topItems
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
};

// CSV 파일 다운로드
const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// 주문 데이터 CSV 다운로드
export const downloadOrdersCSV = (orders: OrderData[], startDate: Date, endDate: Date): void => {
  const filteredOrders = filterOrdersByDateRange(orders, startDate, endDate);
  const csvContent = convertOrdersToCSV(filteredOrders);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  const filename = `주문데이터_${startDateStr}_${endDateStr}.csv`;
  
  downloadCSV(csvContent, filename);
};

// 매출 데이터 CSV 다운로드
export const downloadSalesCSV = (orders: OrderData[], startDate: Date, endDate: Date): void => {
  const filteredOrders = filterOrdersByDateRange(orders, startDate, endDate);
  const salesData = aggregateSalesByDate(filteredOrders);
  const csvContent = convertSalesToCSV(salesData);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  const filename = `매출데이터_${startDateStr}_${endDateStr}.csv`;
  
  downloadCSV(csvContent, filename);
};

// 통합 CSV 다운로드 (주문 + 매출)
export const downloadCombinedCSV = (orders: OrderData[], startDate: Date, endDate: Date): void => {
  const filteredOrders = filterOrdersByDateRange(orders, startDate, endDate);
  const salesData = aggregateSalesByDate(filteredOrders);
  
  // 주문 상세 데이터
  const ordersCSV = convertOrdersToCSV(filteredOrders);
  
  // 매출 요약 데이터
  const salesCSV = convertSalesToCSV(salesData);
  
  // 통합 CSV 생성
  const combinedCSV = `=== 주문 상세 데이터 ===\n${ordersCSV}\n\n=== 매출 요약 데이터 ===\n${salesCSV}`;
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  const filename = `통합데이터_${startDateStr}_${endDateStr}.csv`;
  
  downloadCSV(combinedCSV, filename);
};

// 날짜 범위 옵션
export const getDateRangeOptions = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const last3Months = new Date(today);
  last3Months.setMonth(last3Months.getMonth() - 3);
  
  return {
    today: { start: today, end: today, label: '오늘' },
    yesterday: { start: yesterday, end: yesterday, label: '어제' },
    lastWeek: { start: lastWeek, end: today, label: '최근 7일' },
    lastMonth: { start: lastMonth, end: today, label: '최근 30일' },
    last3Months: { start: last3Months, end: today, label: '최근 3개월' }
  };
}; 