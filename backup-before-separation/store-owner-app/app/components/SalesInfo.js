import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function SalesInfo({ orders = [] }) {
  const [salesData, setSalesData] = useState({
    todaySales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topItems: []
  });

  useEffect(() => {
    if (orders.length > 0) {
      calculateSalesData();
    }
  }, [orders]);

  const calculateSalesData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
      return orderDate >= today;
    });

    const totalSales = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = todayOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // 인기 메뉴 계산
    const itemCounts = {};
    todayOrders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemName = item.name;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.qty || 1);
        });
      }
    });

    const topItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    setSalesData({
      todaySales: totalSales,
      totalOrders,
      averageOrderValue,
      topItems
    });
  };

  const formatCurrency = (amount) => {
    return `₩${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>매출 정보</Text>
          <Text style={styles.headerSubtitle}>오늘의 매출 현황</Text>
        </View>

        {/* Sales Overview Cards */}
        <View style={styles.salesOverview}>
          <View style={styles.salesCard}>
            <View style={styles.salesCardContent}>
              <View style={styles.salesCardIcon}>
                <Ionicons name="trending-up" size={24} color="#10B981" />
              </View>
              <View style={styles.salesCardText}>
                <Text style={styles.salesCardValue}>{formatCurrency(salesData.todaySales)}</Text>
                <Text style={styles.salesCardLabel}>오늘 매출</Text>
              </View>
            </View>
          </View>

          <View style={styles.salesCard}>
            <View style={styles.salesCardContent}>
              <View style={styles.salesCardIcon}>
                <MaterialIcons name="receipt" size={24} color="#3B82F6" />
              </View>
              <View style={styles.salesCardText}>
                <Text style={styles.salesCardValue}>{salesData.totalOrders}건</Text>
                <Text style={styles.salesCardLabel}>총 주문 수</Text>
              </View>
            </View>
          </View>

          <View style={styles.salesCard}>
            <View style={styles.salesCardContent}>
              <View style={styles.salesCardIcon}>
                <FontAwesome5 name="calculator" size={24} color="#F59E0B" />
              </View>
              <View style={styles.salesCardText}>
                <Text style={styles.salesCardValue}>{formatCurrency(salesData.averageOrderValue)}</Text>
                <Text style={styles.salesCardLabel}>평균 주문 금액</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>인기 메뉴</Text>
          <Text style={styles.sectionSubtitle}>오늘 가장 많이 주문된 메뉴</Text>

          {salesData.topItems.length > 0 ? (
            <View style={styles.topItemsList}>
              {salesData.topItems.map((item, index) => (
                <View key={index} style={styles.topItemCard}>
                  <View style={styles.topItemRank}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.topItemInfo}>
                    <Text style={styles.topItemName}>{item.name}</Text>
                    <Text style={styles.topItemCount}>{item.count}회 주문</Text>
                  </View>
                  <View style={styles.topItemIcon}>
                    <Ionicons name="restaurant" size={20} color="#6B7280" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="restaurant" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>아직 주문이 없습니다</Text>
              <Text style={styles.emptyDescription}>
                오늘의 첫 번째 주문을 기다리고 있습니다
              </Text>
            </View>
          )}
        </View>

        {/* Recent Orders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 주문</Text>
          <Text style={styles.sectionSubtitle}>오늘의 주문 내역</Text>

          {orders.length > 0 ? (
            <View style={styles.recentOrdersList}>
              {orders.slice(0, 5).map((order, index) => (
                <View key={order.id} style={styles.recentOrderCard}>
                  <View style={styles.recentOrderHeader}>
                    <View style={styles.recentOrderInfo}>
                      <Text style={styles.recentOrderTable}>{order.tableNumber}번 테이블</Text>
                      <Text style={styles.recentOrderTime}>
                        {order.createdAt?.toDate ? 
                          order.createdAt.toDate().toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 
                          new Date().toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        }
                      </Text>
                    </View>
                    <Text style={styles.recentOrderAmount}>
                      {formatCurrency(order.totalAmount || 0)}
                    </Text>
                  </View>
                  
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <View style={styles.recentOrderItems}>
                      {order.items.slice(0, 3).map((item, itemIndex) => (
                        <Text key={itemIndex} style={styles.recentOrderItem}>
                          {item.name} x{item.qty || 1}
                        </Text>
                      ))}
                      {order.items.length > 3 && (
                        <Text style={styles.recentOrderMore}>
                          외 {order.items.length - 3}개
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>주문 내역이 없습니다</Text>
              <Text style={styles.emptyDescription}>
                새로운 주문이 들어오면 여기에 표시됩니다
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  salesOverview: {
    padding: 20,
    gap: 12,
  },
  salesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  salesCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salesCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  salesCardText: {
    flex: 1,
  },
  salesCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  salesCardLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  topItemsList: {
    gap: 12,
  },
  topItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  topItemCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  topItemIcon: {
    marginLeft: 12,
  },
  recentOrdersList: {
    gap: 12,
  },
  recentOrderCard: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  recentOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentOrderInfo: {
    flex: 1,
  },
  recentOrderTable: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  recentOrderTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentOrderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  recentOrderItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentOrderItem: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recentOrderMore: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#F3F4F6',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 