import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const styles = {
  container: { padding: '20px', fontFamily: 'sans-serif', background: '#f8fafc' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  periodSelector: { display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap' },
  periodButton: (isActive) => ({
    padding: '8px 16px',
    border: `1px solid ${isActive ? '#3b82f6' : '#cbd5e1'}`,
    borderRadius: '6px',
    background: isActive ? '#3b82f6' : '#fff',
    color: isActive ? '#fff' : '#334155',
    fontWeight: '600',
    cursor: 'pointer',
  }),
  cardContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardTitle: { margin: '0 0 10px', fontSize: '16px', color: '#64748b' },
  cardValue: { margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' },
  tableContainer: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { borderBottom: '2px solid #e2e8f0', padding: '12px', textAlign: 'left', color: '#64748b' },
  td: { borderBottom: '1px solid #f1f5f9', padding: '12px' },
};

function decodeUnicodeHex(str) {
  return str.replace(/u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}

function safeDecode(name) {
  try {
    if (/^(u[0-9a-fA-F]{4})+$/.test(name)) return decodeUnicodeHex(name);
    if (/^%[0-9A-Fa-f]{2}/.test(name)) return decodeURIComponent(name);
    return name;
  } catch {
    return name;
  }
}

// 주문 데이터에서 매출 계산 함수
function calculateSalesFromOrders(orders, period = 'today') {
  const now = new Date();
  let startDate = new Date();
  
  // 기간별 시작 날짜 설정
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(now.getDate() - 30);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
  }

  // 해당 기간의 주문만 필터링
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt?.toDate?.() || order.createdAt);
    return orderDate >= startDate && orderDate <= now;
  });

  // 매출 계산
  let totalSales = 0;
  const uniqueCustomers = new Set();
  const menuCounts = {};

  filteredOrders.forEach(order => {
    // 주문 데이터 구조에 따라 items 또는 orders 필드 사용
    let items = [];
    if (order.items && Array.isArray(order.items)) {
      items = order.items;
    } else if (order.orders && Array.isArray(order.orders)) {
      items = order.orders;
    } else if (typeof order.orders === 'string') {
      try {
        items = JSON.parse(order.orders);
      } catch (e) {
        console.error('주문 데이터 파싱 실패:', e);
      }
    }

    // 매출 계산
    items.forEach(item => {
      totalSales += (item.price || 0) * (item.quantity || 1);

      // 메뉴별 통계
      const menuName = safeDecode(item.name || '');
      if (!menuCounts[menuName]) {
        menuCounts[menuName] = { orders: 0, quantity: 0, total: 0 };
      }
      menuCounts[menuName].orders += 1;
      menuCounts[menuName].quantity += (item.quantity || 1);
      menuCounts[menuName].total += (item.price || 0) * (item.quantity || 1);
    });

    // 고객 수 계산 (테이블 번호 기준)
    uniqueCustomers.add(order.tableNumber || order.table || 'unknown');
  });

  const orderCount = filteredOrders.length;
  const customerCount = uniqueCustomers.size;

  // 인기 메뉴 TOP 3
  const popularMenus = Object.entries(menuCounts)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 3)
    .map(([name, data]) => ({
      name,
      orders: data.orders,
      quantity: data.quantity,
      sales: data.total
    }));

  return {
    totalSales,
    orderCount,
    customerCount: uniqueCustomers.size,
    avgOrderValue: orderCount > 0 ? Math.round(totalSales / orderCount) : 0,
    popularMenus
  };
}

export default function SalesTab({ orders = [], userInfo }) {
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(false);

  // 실제 매출 데이터 계산
  const salesData = useMemo(() => {
    return calculateSalesFromOrders(orders, period);
  }, [orders, period]);

  // 어제 데이터와 비교
  const yesterdayData = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt?.toDate?.() || order.createdAt);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
      return orderDate >= yesterday && orderDate < yesterdayEnd;
    });

    return calculateSalesFromOrders(yesterdayOrders, 'today');
  }, [orders]);

  // 변화율 계산
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const salesChange = calculateChange(salesData.totalSales, yesterdayData.totalSales);
  const customerChange = calculateChange(salesData.customerCount, yesterdayData.customerCount);
  const orderChange = calculateChange(salesData.orderCount, yesterdayData.orderCount);
  const avgOrderChange = calculateChange(salesData.avgOrderValue, yesterdayData.avgOrderValue);

  if (loading) {
    return <div style={styles.container}>매출 정보를 불러오는 중...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">매출 정보</h2>
        <p className="text-muted-foreground">
        실제 주문 데이터를 바탕으로 한 매출 분석
      </p>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'today', label: '오늘' },
          { id: 'week', label: '최근 7일' },
          { id: 'month', label: '최근 30일' }
        ].map(p => (
          <Button
            key={p.id}
            variant={period === p.id ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* KPI 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
                {period === 'today' ? '오늘의 총 매출' : period === 'week' ? '최근 7일 총 매출' : '최근 30일 총 매출'}
            </CardTitle>
            <div className="text-2xl">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
                ₩{salesData.totalSales.toLocaleString()}
            </div>
            <p className={`text-xs font-medium mt-2 ${
              salesChange >= 0 ? 'text-success' : 'text-destructive'
            }`}>
                {salesChange >= 0 ? '+' : ''}{salesChange}% 어제 대비
              </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {period === 'today' ? '오늘 방문 고객' : period === 'week' ? '최근 7일 방문 고객' : '최근 30일 방문 고객'}
            </CardTitle>
            <div className="text-2xl">👥</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {salesData.customerCount}명
            </div>
            <p className={`text-xs font-medium mt-2 ${
              customerChange >= 0 ? 'text-success' : 'text-destructive'
            }`}>
                {customerChange >= 0 ? '+' : ''}{customerChange}% 어제 대비
              </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {period === 'today' ? '오늘 주문 수' : period === 'week' ? '최근 7일 주문 수' : '최근 30일 주문 수'}
            </CardTitle>
            <div className="text-2xl">🛒</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {salesData.orderCount}건
            </div>
            <p className={`text-xs font-medium mt-2 ${
              orderChange >= 0 ? 'text-success' : 'text-destructive'
            }`}>
                {orderChange >= 0 ? '+' : ''}{orderChange}% 어제 대비
              </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 객단가
            </CardTitle>
            <div className="text-2xl">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₩{salesData.avgOrderValue.toLocaleString()}
            </div>
            <p className={`text-xs font-medium mt-2 ${
              avgOrderChange >= 0 ? 'text-success' : 'text-destructive'
            }`}>
                {avgOrderChange >= 0 ? '+' : ''}{avgOrderChange}% 어제 대비
              </p>
          </CardContent>
        </Card>
      </div>

      {/* 인기 메뉴 TOP 3 */}
      <Card>
        <CardHeader>
          <CardTitle>인기 메뉴 TOP 3</CardTitle>
          <p className="text-muted-foreground">
          {period === 'today' ? '오늘' : period === 'week' ? '최근 7일' : '최근 30일'} 가장 많이 주문된 메뉴
        </p>
        </CardHeader>
        <CardContent>
        {salesData.popularMenus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesData.popularMenus.map((menu, index) => (
                <div key={menu.name} className="flex items-center gap-3 p-4 border rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-primary' : 'bg-muted'
                  }`}>
                  {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{menu.name}</p>
                    <p className="text-xs text-muted-foreground">
                    {menu.orders}개 주문 • ₩{menu.sales.toLocaleString()}
                    </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">🍽️</div>
              <div className="text-lg font-medium">주문된 메뉴가 없습니다</div>
              <div className="text-sm">
              {period === 'today' ? '오늘' : period === 'week' ? '최근 7일' : '최근 30일'} 동안 주문된 메뉴가 없습니다
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* 데이터 없음 안내 */}
      {salesData.totalSales === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <div className="text-lg font-medium mb-2">매출 데이터가 없습니다</div>
            <div className="text-muted-foreground">
            {period === 'today' ? '오늘' : period === 'week' ? '최근 7일' : '최근 30일'} 동안 주문이 없어 매출 데이터를 표시할 수 없습니다.
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 