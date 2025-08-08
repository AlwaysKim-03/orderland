import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, FlatList } from "react-native";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Calendar } from "lucide-react";
import { MobileHeader } from "../components/ui/mobile-header";

interface SalesData {
  date: string;
  sales: number;
  orders: number;
  customers: number;
}

interface TopItem {
  name: string;
  sales: number;
  quantity: number;
  percentage: number;
}

const mockSalesData: SalesData[] = [
  { date: "1월 10일", sales: 450000, orders: 25, customers: 22 },
  { date: "1월 11일", sales: 520000, orders: 28, customers: 25 },
  { date: "1월 12일", sales: 380000, orders: 20, customers: 18 },
  { date: "1월 13일", sales: 610000, orders: 32, customers: 29 },
  { date: "1월 14일", sales: 480000, orders: 26, customers: 24 },
  { date: "1월 15일", sales: 550000, orders: 30, customers: 27 },
  { date: "1월 16일", sales: 420000, orders: 23, customers: 21 },
];

const mockTopItems: TopItem[] = [
  { name: "돈까스", sales: 180000, quantity: 12, percentage: 25 },
  { name: "김치찌개", sales: 135000, quantity: 15, percentage: 18 },
  { name: "제육볶음", sales: 120000, quantity: 8, percentage: 16 },
  { name: "된장찌개", sales: 96000, quantity: 12, percentage: 13 },
  { name: "비빔밥", sales: 84000, quantity: 7, percentage: 11 },
];

const timeRanges = ["오늘", "이번 주", "이번 달", "이번 분기"];

export default function SalesAnalytics() {
  const [selectedRange, setSelectedRange] = useState("이번 주");

  const currentData = mockSalesData[mockSalesData.length - 1];
  const previousData = mockSalesData[mockSalesData.length - 2];
  
  const salesChange = ((currentData.sales - previousData.sales) / previousData.sales) * 100;
  const ordersChange = ((currentData.orders - previousData.orders) / previousData.orders) * 100;
  const customersChange = ((currentData.customers - previousData.customers) / previousData.customers) * 100;

  const totalSales = mockSalesData.reduce((sum, data) => sum + data.sales, 0);
  const totalOrders = mockSalesData.reduce((sum, data) => sum + data.orders, 0);
  const totalCustomers = mockSalesData.reduce((sum, data) => sum + data.customers, 0);

  const renderTopItem = ({ item, index }: { item: TopItem; index: number }) => (
    <View style={styles.topItemCard}>
      <View style={styles.topItemHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        <View style={styles.topItemInfo}>
          <Text style={styles.topItemName}>{item.name}</Text>
          <Text style={styles.topItemQuantity}>{item.quantity}개 판매</Text>
        </View>
        <View style={styles.topItemSales}>
          <Text style={styles.topItemSalesAmount}>{item.sales.toLocaleString()}원</Text>
          <Text style={styles.topItemPercentage}>{item.percentage}%</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <MobileHeader
        title="매출 분석"
        subtitle="실시간 매출 현황을 확인하세요"
      />

      {/* Time Range Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.rangeContainer}
        contentContainerStyle={styles.rangeContent}
      >
        {timeRanges.map((range) => (
          <Pressable
            key={range}
            style={[
              styles.rangeButton,
              selectedRange === range && styles.rangeButtonActive
            ]}
            onPress={() => setSelectedRange(range)}
          >
            <Text style={[
              styles.rangeButtonText,
              selectedRange === range && styles.rangeButtonTextActive
            ]}>
              {range}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <DollarSign size={20} color="#e67e22" />
            <Text style={styles.metricLabel}>총 매출</Text>
          </View>
          <Text style={styles.metricValue}>{totalSales.toLocaleString()}원</Text>
          <View style={styles.metricChange}>
            {salesChange >= 0 ? (
              <TrendingUp size={16} color="#22c55e" />
            ) : (
              <TrendingDown size={16} color="#ef4444" />
            )}
            <Text style={[
              styles.metricChangeText,
              { color: salesChange >= 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {Math.abs(salesChange).toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <ShoppingCart size={20} color="#e67e22" />
            <Text style={styles.metricLabel}>총 주문</Text>
          </View>
          <Text style={styles.metricValue}>{totalOrders}건</Text>
          <View style={styles.metricChange}>
            {ordersChange >= 0 ? (
              <TrendingUp size={16} color="#22c55e" />
            ) : (
              <TrendingDown size={16} color="#ef4444" />
            )}
            <Text style={[
              styles.metricChangeText,
              { color: ordersChange >= 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {Math.abs(ordersChange).toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Users size={20} color="#e67e22" />
            <Text style={styles.metricLabel}>고객 수</Text>
          </View>
          <Text style={styles.metricValue}>{totalCustomers}명</Text>
          <View style={styles.metricChange}>
            {customersChange >= 0 ? (
              <TrendingUp size={16} color="#22c55e" />
            ) : (
              <TrendingDown size={16} color="#ef4444" />
            )}
            <Text style={[
              styles.metricChangeText,
              { color: customersChange >= 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {Math.abs(customersChange).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Sales Chart Placeholder */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>매출 추이</Text>
          <Text style={styles.chartSubtitle}>최근 7일간의 매출 현황</Text>
        </View>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>📊</Text>
          <Text style={styles.chartPlaceholderTitle}>차트 영역</Text>
          <Text style={styles.chartPlaceholderDescription}>
            매출 추이를 시각적으로 확인할 수 있는 차트가 표시됩니다
          </Text>
        </View>
      </View>

      {/* Top Selling Items */}
      <View style={styles.topItemsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>인기 메뉴</Text>
          <Text style={styles.sectionSubtitle}>매출 기여도 순</Text>
        </View>
        
        <FlatList
          data={mockTopItems}
          renderItem={renderTopItem}
          keyExtractor={(item) => item.name}
          style={styles.topItemsList}
          contentContainerStyle={styles.topItemsListContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe', // 원본: hsl(32 100% 98%)
  },
  rangeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rangeContent: {
    gap: 8,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    borderRadius: 20,
  },
  rangeButtonActive: {
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%)
    borderColor: '#e67e22', // 원본: hsl(15 85% 58%)
  },
  rangeButtonText: {
    fontSize: 14,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  rangeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 8,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 48,
    marginBottom: 12,
  },
  chartPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 4,
  },
  chartPlaceholderDescription: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    textAlign: 'center',
    lineHeight: 16,
  },
  topItemsContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 100,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  topItemsList: {
    flex: 1,
  },
  topItemsListContent: {
    gap: 8,
  },
  topItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
  },
  topItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%)
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 2,
  },
  topItemQuantity: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  topItemSales: {
    alignItems: 'flex-end',
  },
  topItemSalesAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e67e22', // 원본: hsl(15 85% 58%)
    marginBottom: 2,
  },
  topItemPercentage: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
});