import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { testFirebaseConnection, getFirebaseConfig } from '../../firebase';

export default function FirebaseStatus() {
  const [status, setStatus] = useState({ loading: true, connected: false, message: '' });
  const [config, setConfig] = useState(null);

  useEffect(() => {
    checkConnection();
    setConfig(getFirebaseConfig());
  }, []);

  const checkConnection = async () => {
    setStatus({ loading: true, connected: false, message: '연결 확인 중...' });
    
    try {
      const result = await testFirebaseConnection();
      setStatus({
        loading: false,
        connected: result.success,
        message: result.message
      });
      
      if (!result.success) {
        Alert.alert('Firebase 연결 실패', result.message);
      }
    } catch (error) {
      setStatus({
        loading: false,
        connected: false,
        message: '연결 확인 중 오류 발생: ' + error.message
      });
      Alert.alert('오류', 'Firebase 연결 확인 중 오류가 발생했습니다.');
    }
  };

  if (status.loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Firebase 연결 상태 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase 연결 상태</Text>
      
      <View style={[styles.statusBox, { backgroundColor: status.connected ? '#e8f5e8' : '#ffe8e8' }]}>
        <Text style={[styles.statusText, { color: status.connected ? '#2e7d32' : '#d32f2f' }]}>
          {status.connected ? '✅ 연결됨' : '❌ 연결 안됨'}
        </Text>
        <Text style={styles.messageText}>{status.message}</Text>
      </View>

      {config && (
        <View style={styles.configBox}>
          <Text style={styles.configTitle}>Firebase 설정 정보</Text>
          <Text style={styles.configText}>Project ID: {config.projectId}</Text>
          <Text style={styles.configText}>Auth Domain: {config.authDomain}</Text>
          <Text style={styles.configText}>Storage Bucket: {config.storageBucket}</Text>
          <Text style={styles.configText}>App ID: {config.appId}</Text>
        </View>
      )}

      <Button 
        title="연결 상태 다시 확인" 
        onPress={checkConnection}
        color={status.connected ? '#007AFF' : '#d32f2f'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  statusBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  configBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  configText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
}); 