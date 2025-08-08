import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function OrderList({ orders = [], onAcknowledge }) {
  const renderOrderItem = ({ item: order }) => {
    const orderTime = order.createdAt?.toDate ? 
      order.createdAt.toDate().toLocaleString('ko-KR') : 
      new Date().toLocaleString('ko-KR');

    const getStatusColor = (status) => {
      switch (status) {
        case 'new': return '#3B82F6';
        case 'processing': return '#F59E0B';
        case 'completed': return '#10B981';
        case 'cancelled': return '#EF4444';
        default: return '#6B7280';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'new': return '신규 주문';
        case 'processing': return '조리 중';
        case 'completed': return '완료';
        case 'cancelled': return '취소됨';
        default: return '대기 중';
      }
    };

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.tableInfo}>
              <Ionicons name="restaurant" size={20} color="#3B82F6" />
              <Text style={styles.tableNumber}>{order.tableNumber}번 테이블</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
          </View>
          <Text style={styles.orderTime}>{orderTime}</Text>
        </View>

        <View style={styles.orderItems}>
          {Array.isArray(order.items) && order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.options && item.options.length > 0 && (
                  <Text style={styles.itemOptions}>
                    {item.options.join(', ')}
                  </Text>
                )}
              </View>
              <View style={styles.itemQuantity}>
                <Text style={styles.quantityText}>x{item.qty || 1}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>총 금액</Text>
            <Text style={styles.totalAmount}>₩{order.totalAmount?.toLocaleString()}</Text>
          </View>
          
          {order.status === 'new' && (
            <TouchableOpacity
              style={styles.acknowledgeButton}
              onPress={() => onAcknowledge(order.id)}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.acknowledgeButtonText}>확인</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt" size={64} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>신규 주문이 없습니다</Text>
          <Text style={styles.emptyDescription}>
            새로운 주문이 들어오면 여기에 표시됩니다
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>실시간 주문</Text>
        <Text style={styles.headerSubtitle}>{orders.length}개의 주문</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.orderList}
        showsVerticalScrollIndicator={false}
      />
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
  orderList: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  orderTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  itemOptions: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemQuantity: {
    marginLeft: 12,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acknowledgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 128,
    height: 128,
    backgroundColor: '#F3F4F6',
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 