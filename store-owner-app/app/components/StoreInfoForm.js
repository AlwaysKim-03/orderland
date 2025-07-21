import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import uuid from 'react-native-uuid';
import { db } from '../../firebase';

function toInternationalPhone(phone) {
  // 010-1234-5678, 01012345678 등 → +82 10 1234 5678
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('82')) return '+' + cleaned;
  if (cleaned.startsWith('010')) {
    return '+82' + cleaned.slice(1);
  }
  if (cleaned.startsWith('10')) {
    return '+82' + cleaned;
  }
  if (phone.startsWith('+82')) return phone;
  return phone;
}

function toDisplayPhone(phone) {
  // +82, 82, 010, 10 등 다양한 형식을 010-xxxx-xxxx로 변환
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('82')) cleaned = '0' + cleaned.slice(2);
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

export default function StoreInfoForm({ userInfo, onStoreUpdate }) {
  const [form, setForm] = useState({
    store_name: userInfo.store_name || '',
    phone: userInfo.phone || '',
    tableCount: userInfo.tableCount || 1,
  });
  const [editing, setEditing] = useState(false);
  const [tableTokens, setTableTokens] = useState(userInfo.tableTokens || Array.from({length: userInfo.tableCount || 1}, () => uuid.v4()));
  const qrRefs = useRef([]);

  useEffect(() => {
    setTableTokens(prev => {
      const count = Number(form.tableCount) || 1;
      if (prev.length === count) return prev;
      if (prev.length < count) {
        // 부족한 만큼 새 토큰 추가
        return [...prev, ...Array.from({length: count - prev.length}, () => uuid.v4())];
      }
      // 초과분 잘라내기
      return prev.slice(0, count);
    });
  }, [form.tableCount]);

  const handleUpdate = () => {
    const tableCountNum = Number(form.tableCount);
    if (isNaN(tableCountNum) || tableCountNum < 1) {
      Alert.alert('테이블 수는 1 이상의 숫자여야 합니다.');
      return;
    }
    
    if (!form.store_name.trim()) {
      Alert.alert('가게명을 입력해주세요.');
      return;
    }

    onStoreUpdate && onStoreUpdate({
      store_name: form.store_name.trim(),
      phone: toInternationalPhone(form.phone),
      tableCount: tableCountNum,
      tableTokens,
    });
    setEditing(false);
  };

  const shareQRCode = async (idx) => {
    try {
      const qrRef = qrRefs.current[idx];
      if (!qrRef) {
        Alert.alert('QR 코드를 생성할 수 없습니다.');
        return;
      }
      
      qrRef.toDataURL(async (data) => {
        try {
          const fileUri = FileSystem.cacheDirectory + `table${idx+1}_qr.png`;
          await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });
          await Sharing.shareAsync(fileUri);
        } catch (error) {
          Alert.alert('QR 코드 공유 중 오류가 발생했습니다.', error.message);
        }
      });
    } catch (error) {
      Alert.alert('QR 코드 생성 중 오류가 발생했습니다.', error.message);
    }
  };

  return (
    <ScrollView style={styles.box}>
      <Text style={styles.sectionTitle}>가게 정보</Text>
      <Text>이메일: {userInfo.email}</Text>
      {editing ? (
        <>
          <TextInput
            style={styles.input}
            value={form.store_name}
            onChangeText={v => setForm(f => ({ ...f, store_name: v }))}
            placeholder="가게명"
          />
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={v => setForm(f => ({ ...f, phone: v }))}
            placeholder="전화번호"
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            value={String(form.tableCount)}
            onChangeText={v => setForm(f => ({ ...f, tableCount: v }))}
            placeholder="테이블 수"
            keyboardType="number-pad"
          />
          <Button title="저장" onPress={handleUpdate} />
          <Button title="취소" onPress={() => setEditing(false)} color="#aaa" />
        </>
      ) : (
        <>
          <Text>가게명: {userInfo.store_name}</Text>
          <Text>전화번호: {toDisplayPhone(userInfo.phone)}</Text>
          <Text>테이블 수: {userInfo.tableCount}</Text>
          
          {/* 사업자 인증 정보 표시 */}
          {userInfo.businessVerified && (
            <View style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 8, borderWidth: 1, borderColor: '#e0f0ff' }}>
              <Text style={{ marginBottom: 8, color: '#0066cc', fontWeight: 'bold' }}>✓ 사업자 인증 완료</Text>
              <Text style={{ marginVertical: 2 }}>사업자등록번호: {userInfo.businessNumber}</Text>
              <Text style={{ marginVertical: 2 }}>상호명: {userInfo.businessName}</Text>
              <Text style={{ marginVertical: 2 }}>대표자명: {userInfo.representativeName}</Text>
              <Text style={{ marginVertical: 2 }}>개업일: {userInfo.openingDate}</Text>
              <Text style={{ marginVertical: 2, fontSize: 12, color: '#666' }}>
                인증일: {userInfo.verifiedAt ? new Date(userInfo.verifiedAt).toLocaleDateString() : '정보 없음'}
              </Text>
            </View>
          )}
          
          {!userInfo.businessVerified && (
            <View style={{ marginTop: 16, padding: 12, backgroundColor: '#fff3cd', borderRadius: 8, borderWidth: 1, borderColor: '#ffeaa7' }}>
              <Text style={{ color: '#856404' }}>
                ⚠️ 사업자 인증이 필요합니다.{'\n'}
                사업자 인증을 완료하면 더 안전한 서비스를 이용할 수 있습니다.
              </Text>
            </View>
          )}
          
          <Button title="수정" onPress={() => setEditing(true)} />
        </>
      )}
      <Text style={{marginTop: 24, fontWeight: 'bold'}}>테이블별 QR코드/토큰</Text>
      {Array.from({length: form.tableCount || 1}).map((_, idx) => {
        const token = tableTokens[idx] || '';
        // 개발 환경에서는 localhost 사용, 프로덕션에서는 order.land 사용
        const baseUrl = __DEV__ ? 'http://localhost:5184' : 'https://order.land';
        const url = `${baseUrl}/${encodeURIComponent(userInfo.store_name)}/table-${idx+1}`;
        return (
          <View key={idx} style={styles.qrBox}>
            <QRCode
              value={url}
              size={100}
              getRef={c => qrRefs.current[idx] = c}
            />
            <Text selectable style={{fontSize:12, marginTop:4}}>테이블 {idx+1}</Text>
            <Text selectable style={{fontSize:10, color:'#888'}}>{`${baseUrl}/${encodeURIComponent(userInfo.store_name)}/table-${idx+1}`}</Text>
            <View style={{flexDirection:'row', marginTop:4}}>
              <Button title="QR공유" onPress={() => shareQRCode(idx)} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  qrBox: { alignItems:'center', marginVertical:12, padding:8, backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#eee' },
}); 