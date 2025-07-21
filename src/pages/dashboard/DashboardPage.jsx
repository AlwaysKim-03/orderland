import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatisticsCards } from '@/components/dashboard/StatisticsCards';
import { OrdersSection } from '@/components/dashboard/OrdersSection';
import { ReservationsSection } from '@/components/dashboard/ReservationsSection';

export function DashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
            <p className="text-muted-foreground">
              오늘의 매장 현황을 한눈에 확인하세요
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <StatisticsCards />

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Orders Section */}
          <OrdersSection />
          
          {/* Reservations Section */}
          <ReservationsSection />
        </div>
      </div>
    </AdminLayout>
  );
} 