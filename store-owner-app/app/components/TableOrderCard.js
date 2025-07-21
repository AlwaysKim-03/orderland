import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { db, auth } from '../../firebase';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import OrderDetailModal from './OrderDetailModal';

function groupOrdersByTable(orders) {
  const grouped = {};
  orders.forEach(order => {
    const table = order.tableNumber || '기타';
    if (!grouped[table]) grouped[table] = [];
    grouped[table].push(order);
  });
  return grouped;
}

export default function TableOrderCard({ orders, tableCount }) {
  const grouped = groupOrdersByTable(orders);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleTablePress = (tableNumber) => {
    setSelectedTable(tableNumber);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedTable(null);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!orderId) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      Alert.alert('주문 삭제 실패', e.message);
    }
  };

  const getTableOrders = (tableNumber) => {
    return grouped[tableNumber] || [];
  };

  return (
    <View>
      <FlatList
        data={Array.from({ length: Number(tableCount) || 1 }, (_, i) => i + 1)}
        keyExtractor={i => String(i)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item: tableNum }) => {
          const tableOrders = getTableOrders(tableNum);
          const totalAmount = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
          const lastStatus = tableOrders.length > 0 ? (tableOrders[tableOrders.length - 1].status || '') : '';
          const lastOrderId = tableOrders.length > 0 ? tableOrders[tableOrders.length - 1].id : undefined;
          const isNew = tableOrders.some(o => o.status === 'new');

          return (
            <TouchableOpacity 
              style={[
                styles.card, 
                isNew && styles.newOrderCard
              ]} 
              onPress={() => handleTablePress(tableNum)}
              activeOpacity={0.7}
            >
              <Text style={styles.tableTitle}>{tableNum}번</Text>
              {tableOrders.length > 0 ? (
                <View style={styles.centerBox}>
                  <Text style={styles.menuText}>
                    {tableOrders.map(o => (o.items||[]).map(i => `${i.name||''}x${i.qty||1}`).join(', ')).join(', ')}
                  </Text>
                  <Text style={styles.amountText}>총액: {totalAmount.toLocaleString()}원</Text>
                  <Text style={styles.statusText}>상태: {lastStatus}</Text>
                  {lastOrderId && (
                    <Button 
                      title="주문 삭제" 
                      color="#d32f2f" 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(lastOrderId);
                      }} 
                    />
                  )}
                </View>
              ) : (
                <View style={styles.centerBox}>
                  <Text style={styles.emptyText}>비어있음</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* 주문 상세 모달 */}
      <OrderDetailModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        tableNumber={selectedTable}
        orders={selectedTable ? getTableOrders(selectedTable) : []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fafbfc',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 160,
    minHeight: 180,
    flex: 1,
    margin: 8,
    justifyContent: 'flex-start',
  },
  newOrderCard: {
    borderWidth: 2,
    borderColor: '#f59e42',
    backgroundColor: '#fff',
  },
  tableTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 18,
    color: '#222',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  amountText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 15,
    color: '#888',
    marginBottom: 10,
    textAlign: 'center',
  },
}); 