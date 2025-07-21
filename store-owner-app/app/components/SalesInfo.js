import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList } from 'react-native';
import { db, auth } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

function getDateKey(date, period) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (period === 'today') return `${year}-${month}-${day}`;
  if (period === 'week') {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekYear = weekStart.getFullYear();
    const weekMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
    const weekDay = String(weekStart.getDate()).padStart(2, '0');
    return `week-${weekYear}-${weekMonth}-${weekDay}`;
  }
  if (period === 'month') return `${year}-${month}`;
  return `${year}-${month}-${day}`;
}

export default function SalesInfo() {
  const [period, setPeriod] = useState('today');
  const [sales, setSales] = useState({ total: 0, count: 0, avg: 0, menuSales: {} });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 웹앱과 동일한 구조로 주문 데이터 가져오기
    const unsub = onSnapshot(
      query(collection(db, 'orders'), where('storeId', '==', user.uid)),
      (snap) => {
        const now = new Date();
        let total = 0, count = 0;
        const menuSales = {};
        
        snap.forEach(doc => {
          const d = doc.data();
          if (!d.paid) return;
          if (!d.createdAt) return;
          
          const date = d.createdAt?.toDate?.() || new Date(d.createdAt);
          let match = false;
          
          if (period === 'today') {
            match = date.toDateString() === now.toDateString();
          } else if (period === 'week') {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            match = date >= weekStart && date <= now;
          } else if (period === 'month') {
            match = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }
          
          if (match) {
            total += d.total || 0;
            count++;
            
            // 웹앱과 동일한 items 구조 사용
            const items = Array.isArray(d.items) ? d.items : [];
            items.forEach(item => {
              if (!item || !item.name) return;
              if (!menuSales[item.name]) menuSales[item.name] = { quantity: 0, total: 0 };
              menuSales[item.name].quantity += item.qty || 1;
              menuSales[item.name].total += (item.qty || 1) * (item.price || 0);
            });
          }
        });
        
        setSales({
          total,
          count,
          avg: count > 0 ? total / count : 0,
          menuSales,
        });
      }
    );
    return unsub;
  }, [period]);

  const menuSalesArray = Object.entries(sales.menuSales || {}).sort(([, a], [, b]) => b.total - a.total);

  return (
    <View style={styles.box}>
      <Text style={styles.sectionTitle}>매출정보</Text>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Button title="오늘" onPress={() => setPeriod('today')} color={period==='today' ? '#007AFF' : '#aaa'} />
        <Button title="이번주" onPress={() => setPeriod('week')} color={period==='week' ? '#007AFF' : '#aaa'} />
        <Button title="이번달" onPress={() => setPeriod('month')} color={period==='month' ? '#007AFF' : '#aaa'} />
      </View>
      <View style={styles.cardRow}>
        <View style={styles.card}><Text style={styles.cardTitle}>총 매출</Text><Text style={styles.cardValue}>{sales.total.toLocaleString()}원</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>주문 건수</Text><Text style={styles.cardValue}>{sales.count}건</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>평균 주문 금액</Text><Text style={styles.cardValue}>{sales.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}원</Text></View>
      </View>
      <Text style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>메뉴별 판매 순위</Text>
      {menuSalesArray.length === 0 ? (
        <Text style={{ color: '#888' }}>판매 데이터가 없습니다.</Text>
      ) : (
        <View style={styles.tableBox}>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>순위</Text>
            <Text style={styles.th}>메뉴명</Text>
            <Text style={styles.th}>판매량</Text>
            <Text style={styles.th}>판매액</Text>
          </View>
          <FlatList
            data={menuSalesArray}
            keyExtractor={([name]) => name}
            renderItem={({ item, index }) => (
              <View style={styles.tr}>
                <Text style={styles.td}>{index + 1}</Text>
                <Text style={styles.td}>{item[0]}</Text>
                <Text style={styles.td}>{item[1].quantity}개</Text>
                <Text style={styles.td}>{item[1].total.toLocaleString()}원</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, marginHorizontal: 4, alignItems: 'center', elevation: 2 },
  cardTitle: { fontSize: 14, color: '#888' },
  cardValue: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  tableBox: { marginTop: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', padding: 8, backgroundColor: '#f0f0f0' },
  th: { flex: 1, fontWeight: 'bold', color: '#555' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', padding: 8 },
  td: { flex: 1, color: '#222' },
}); 