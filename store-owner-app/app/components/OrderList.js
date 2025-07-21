import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { db, auth } from '../../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import TableOrderCard from './TableOrderCard';

export default function OrderList({ tableCount }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 웹앱과 동일한 구조로 주문 데이터 가져오기
    const q = query(
      collection(db, 'orders'), 
      where('storeId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(order => order.createdAt !== undefined && order.createdAt !== null)
      );
    });
    return unsub;
  }, []);

  const safeTableCount = Number(tableCount) || 1;

  return (
    <View style={styles.box}>
      <TableOrderCard orders={orders} tableCount={safeTableCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 16, marginBottom: 24 },
}); 