import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { db } from '../../firebase';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

function generateTableToken() {
  // 간단한 랜덤 토큰 생성
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

function useTableOrderStatus(tableCount) {
  const [statuses, setStatuses] = useState(Array(tableCount).fill('주문 없음'));
  useEffect(() => {
    const unsubscribes = [];
    for (let i = 0; i < tableCount; i++) {
      const q = query(
        collection(db, 'orders'),
        where('tableNumber', '==', i + 1),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        if (snap.empty) {
          setStatuses(s => {
            const arr = [...s];
            arr[i] = '주문 없음';
            return arr;
          });
        } else {
          const order = snap.docs[0].data();
          setStatuses(s => {
            const arr = [...s];
            arr[i] = order.status + (order.paid ? ' (결제완료)' : '');
            return arr;
          });
        }
      });
      unsubscribes.push(unsub);
    }
    return () => unsubscribes.forEach(unsub => unsub());
  }, [tableCount]);
  return statuses;
}

export default function TableQRList({ userInfo }) {
  const [tokens, setTokens] = useState(userInfo.tableTokens || Array.from({ length: userInfo.tableCount || 1 }, generateTableToken));
  const qrRefs = useRef([]);
  const statuses = useTableOrderStatus(userInfo.tableCount || 1);

  const handleSave = async (idx) => {
    try {
      const ref = qrRefs.current[idx];
      if (!ref) return;
      ref.toDataURL(async (data) => {
        const filename = `table-${idx + 1}-qr.png`;
        const fileUri = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('갤러리 접근 권한이 필요합니다.');
          return;
        }
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('QR Codes', asset, false);
        Alert.alert('QR코드가 갤러리에 저장되었습니다!');
      });
    } catch (e) {
      Alert.alert('저장 오류', e.message);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.sectionTitle}>테이블별 QR 코드</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Array.from({ length: userInfo.tableCount || 1 }).map((_, idx) => {
          // 개발 환경에서는 localhost 사용, 프로덕션에서는 order.land 사용
          const baseUrl = __DEV__ ? 'http://localhost:5184' : 'https://order.land';
          const url = `${baseUrl}/${userInfo.store_name || 'store'}/table-${idx + 1}`;
          return (
            <View key={idx} style={styles.qrBox}>
              <QRCode
                value={url}
                size={120}
                getRef={c => (qrRefs.current[idx] = c)}
              />
              <Text style={styles.qrLabel}>테이블 {idx + 1}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  qrBox: { alignItems: 'center', marginRight: 24 },
  qrLabel: { marginTop: 8, fontSize: 14 },
}); 