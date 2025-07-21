import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PopularMenuSection({ orders = [] }) {
  // 인기 메뉴 계산
  const popularMenus = useMemo(() => {
    const menuCounts = {};
    
    orders.forEach(order => {
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

      items.forEach(item => {
        const menuName = item.name || '메뉴명 없음';
        if (!menuCounts[menuName]) {
          menuCounts[menuName] = { 
            orders: 0, 
            quantity: 0, 
            total: 0,
            price: item.price || 0
          };
        }
        menuCounts[menuName].orders += 1;
        menuCounts[menuName].quantity += (item.quantity || 1);
        menuCounts[menuName].total += (item.price || 0) * (item.quantity || 1);
      });
    });
    
    return Object.entries(menuCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 4); // TOP 4
  }, [orders]);

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900">Today Orders</CardTitle>
        <p className="text-sm text-gray-600">오늘 주문된 인기 메뉴</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {popularMenus.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-2">🍽️</div>
            <div className="text-sm text-gray-600">주문된 메뉴가 없습니다</div>
          </div>
        ) : (
          popularMenus.map((menu, index) => (
            <div key={menu.name} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{menu.name}</p>
                <p className="text-xs text-gray-500">{menu.orders}번 주문</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-orange-600 text-sm">₩{menu.price.toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
} 