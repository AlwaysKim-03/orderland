import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, Modal, TextInput, FlatList } from 'react-native';
import { db, auth, reconnectFirestore, checkFirestoreConnection } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc, onSnapshot, query, collection, where, orderBy, writeBatch, getDocs } from 'firebase/firestore';
import StoreInfoForm from './components/StoreInfoForm';
import OrderList from './components/OrderList';
import SalesInfo from './components/SalesInfo';
import MenuManager from './components/MenuManager';
import { deleteUser, signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import * as firebase from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricAuth from './utils/biometrics';

const TABS = ['가게정보', '주문정보', '매출정보', '음식메뉴'];

export default function OwnerDashboard({ onLogout }) {
  const [userInfo, setUserInfo] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [realtimeOrders, setRealtimeOrders] = useState([]);
  const [biometricStatus, setBiometricStatus] = useState({
    isAvailable: false,
    isEnabled: false,
    supportedTypes: []
  });

  // 탭 상태 복원 (앱 재시작/새로고침 시)
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('lastTab');
      if (saved !== null) setTab(Number(saved));
    })();
  }, []);

  const handleTabChange = async (idx) => {
    setTab(idx);
    await AsyncStorage.setItem('lastTab', String(idx));
  };

  const router = useRouter();

  // 생체인증 상태 확인
  const checkBiometricStatus = async () => {
    try {
      const status = await BiometricAuth.checkBiometricSetup();
      setBiometricStatus(status);
    } catch (error) {
      console.error('생체인증 상태 확인 실패:', error);
    }
  };

  // 생체인증 활성화
  const handleEnableBiometric = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const result = await BiometricAuth.enableBiometric(user.uid);
      if (result.success) {
        Alert.alert('성공', result.message);
        await checkBiometricStatus();
      } else {
        Alert.alert('실패', result.message);
      }
    } catch (error) {
      console.error('생체인증 활성화 실패:', error);
      Alert.alert('오류', '생체인증 활성화에 실패했습니다.');
    }
  };

  // 생체인증 비활성화
  const handleDisableBiometric = async () => {
    Alert.alert(
      '생체인증 비활성화',
      '정말로 생체인증을 비활성화하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '비활성화',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await BiometricAuth.disableBiometric();
              if (result.success) {
                Alert.alert('성공', result.message);
                await checkBiometricStatus();
              } else {
                Alert.alert('실패', result.message);
              }
            } catch (error) {
              console.error('생체인증 비활성화 실패:', error);
              Alert.alert('오류', '생체인증 비활성화에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsub = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log('사용자 인증됨:', user.uid);
          
          // Firebase 연결 테스트
          const connectionTest = await checkFirestoreConnection();
          if (!connectionTest) {
            console.log('Firestore 연결 문제 감지, 재연결 시도...');
            await reconnectFirestore();
          }
          
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserInfo(userData);
            setLoading(false);
            
            // 생체인증 상태 확인
            await checkBiometricStatus();
          } else {
            setError('사용자 정보를 찾을 수 없습니다.');
            setLoading(false);
          }
        } catch (e) {
          console.error('사용자 정보 로딩 오류:', e);
          setError('사용자 정보를 불러오는데 실패했습니다: ' + e.message);
          setLoading(false);
        }
      } else {
        console.log('사용자 인증되지 않음');
        setUserInfo(null);
        setLoading(false);
      }
    });
    
    return () => {
      if (unsub) unsub();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!userInfo?.uid) return;
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const setupOrderSubscription = () => {
      // 실시간 신규 주문 구독 (오류 처리 개선)
      const q = query(
        collection(db, 'orders'),
        where('storeId', '==', userInfo.uid),
        where('status', '==', 'new'),
        orderBy('createdAt', 'desc')
      );
      
      const unsub = onSnapshot(q, 
        (snap) => {
          console.log('실시간 주문 업데이트 성공:', snap.docs.length, '개 주문');
          setRealtimeOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          retryCount = 0; // 성공 시 재시도 카운트 리셋
        },
        async (error) => {
          console.error('실시간 주문 구독 오류:', error);
          
          // 네트워크 오류인 경우 재연결 시도
          if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || 
              error.message?.includes('transport errored') || 
              error.message?.includes('ERR_QUIC_PROTOCOL_ERROR')) {
            
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`네트워크 오류로 재연결 시도 중... (${retryCount}/${maxRetries})`);
              
              // Firestore 재연결 시도
              const reconnected = await reconnectFirestore();
              if (reconnected) {
                console.log('재연결 성공, 구독 재시작...');
                setTimeout(() => {
                  if (userInfo?.uid) {
                    setupOrderSubscription();
                  }
                }, 2000);
              } else {
                console.log('재연결 실패, 다시 시도...');
                setTimeout(() => {
                  if (userInfo?.uid) {
                    setupOrderSubscription();
                  }
                }, 5000);
              }
            } else {
              console.error('최대 재시도 횟수 초과');
              Alert.alert('연결 오류', '네트워크 연결에 문제가 있습니다. 앱을 다시 시작해주세요.');
            }
          }
        }
      );
      
      return unsub;
    };
    
    const unsub = setupOrderSubscription();
    return unsub;
  }, [userInfo?.uid]);

  const handleStoreUpdate = async (newInfo) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        return;
      }
      
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, newInfo);
      setUserInfo({ ...userInfo, ...newInfo });
      Alert.alert('성공', '가게 정보가 업데이트되었습니다.');
    } catch (e) {
      console.error('가게 정보 업데이트 오류:', e);
      Alert.alert('오류', '가게 정보 업데이트에 실패했습니다: ' + e.message);
    }
  };

  // 주문 확인 처리 (상태를 'new' -> 'processing'으로 변경)
  const handleAcknowledgeOrder = async (orderId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const orderDocRef = doc(db, "orders", orderId);
      await updateDoc(orderDocRef, { status: 'processing' });
      Alert.alert('성공', '주문이 확인되었습니다.');
    } catch (error) {
      console.error("주문 확인 처리 실패:", error);
      Alert.alert('오류', '주문 확인 처리에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive', onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
                return;
              }
              
              await deleteDoc(doc(db, 'users', user.uid));
              await deleteUser(user);
              Alert.alert('성공', '계정이 삭제되었습니다.');
              onLogout && onLogout();
            } catch (e) {
              console.error('계정 삭제 오류:', e);
              Alert.alert('오류', '계정 삭제에 실패했습니다: ' + e.message);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (e) {
      Alert.alert('로그아웃 실패', e.message);
    }
  };

  const handleAccountReset = async () => {
    setModalLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, accountPassword);
      await user.reauthenticateWithCredential(credential);
      
      // 데이터 초기화 로직
      const collectionsToDelete = ['products', 'categories', 'orders', 'staff_calls', 'sales_summary', 'businessVerifications'];
      const batch = writeBatch(db);

      for (const coll of collectionsToDelete) {
        const q = query(collection(db, coll), where("storeId", "==", user.uid));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();

      // 사업자 인증 정보도 함께 삭제
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { 
        store_name: '내 매장', 
        tableCount: 0,
        // 사업자 인증 정보 삭제
        businessVerified: false,
        businessNumber: null,
        businessName: null,
        representativeName: null,
        openingDate: null,
        verifiedAt: null
      });
      
      Alert.alert('정보 초기화', '모든 데이터가 초기화되었습니다.');
      setShowAccountModal(false);
      setAccountPassword('');
      // 페이지 새로고침
      window.location.reload();
    } catch (e) {
      Alert.alert('오류', e.message);
    }
    setModalLoading(false);
  };

  const handleAccountDelete = async () => {
    setModalLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, accountPassword);
      await user.reauthenticateWithCredential(credential);
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      Alert.alert('계정 삭제', '계정이 삭제되었습니다.');
      setShowAccountModal(false);
      setAccountPassword('');
      router.replace('/');
    } catch (e) {
      Alert.alert('오류', e.message);
    }
    setModalLoading(false);
  };

  if (loading) return <Text style={{textAlign:'center',marginTop:40}}>로딩 중...</Text>;
  if (error) return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text style={{color:'red',marginBottom:16}}>{error}</Text>
      <Button title="다시 시도" onPress={()=>window.location.reload()} />
      <Button title="로그아웃" onPress={onLogout} color="#d32f2f" />
    </View>
  );

  if (!userInfo) return <Text style={styles.errorText}>사용자 정보를 찾을 수 없습니다.</Text>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* 탭 버튼 */}
        <View style={styles.tabBar}>
          {TABS.map((label, idx) => (
            <TouchableOpacity key={label} style={[styles.tab, tab === idx && styles.activeTab]} onPress={() => handleTabChange(idx)}>
              <Text style={[styles.tabText, tab === idx && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 탭별 내용 */}
        {tab === 0 && (
          <ScrollView contentContainerStyle={styles.container}>
            <StoreInfoForm userInfo={userInfo} onStoreUpdate={handleStoreUpdate} />
            <Button title="로그아웃" onPress={handleLogout} />
            <View style={{ marginTop: 16 }}>
              <Button title="계정 관리" color="#d32f2f" onPress={() => setShowAccountModal(true)} />
            </View>
          </ScrollView>
        )}
        {tab === 1 && (
          <FlatList
            data={realtimeOrders}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
              <View style={{ padding: 24, paddingBottom: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>실시간 주문 내역</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View key={item.id} style={{ 
                borderBottomWidth: 1, 
                borderColor: '#eee', 
                paddingVertical: 12,
                paddingHorizontal: 8,
                backgroundColor: '#f9f9f9',
                borderRadius: 8,
                marginBottom: 8,
                marginHorizontal: 24
              }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.tableNumber}번 테이블</Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : ''}
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14 }}>
                  {Array.isArray(item.items) ? item.items.map((item, i) => `${item.name} x ${item.qty || 1}`).join(', ') : ''}
                </Text>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: 8 
                }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                    총 {item.totalAmount?.toLocaleString()}원
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#4CAF50',
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 6,
                      minWidth: 80,
                      alignItems: 'center'
                    }}
                    onPress={() => handleAcknowledgeOrder(item.id)}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                      확인
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={{ padding: 24, paddingTop: 12 }}>
                <Text style={{ color: '#888', marginBottom: 16 }}>신규 주문이 없습니다.</Text>
              </View>
            )}
            ListFooterComponent={() => (
              <View style={{ padding: 24, paddingTop: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginVertical: 12 }}>테이블별 주문 현황</Text>
                <OrderList tableCount={userInfo.tableCount || 1} />
                <Button title="로그아웃" onPress={handleLogout} />
                <View style={{ marginTop: 16 }}>
                  <Button title="계정 관리" color="#d32f2f" onPress={() => setShowAccountModal(true)} />
                </View>
              </View>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
        {tab === 2 && (
          <ScrollView contentContainerStyle={styles.container}>
            <SalesInfo />
            <Button title="로그아웃" onPress={handleLogout} />
            <View style={{ marginTop: 16 }}>
              <Button title="계정 관리" color="#d32f2f" onPress={() => setShowAccountModal(true)} />
            </View>
          </ScrollView>
        )}
        {tab === 3 && (
          <View style={styles.container}>
            <MenuManager />
            <Button title="로그아웃" onPress={handleLogout} />
            <View style={{ marginTop: 16 }}>
              <Button title="계정 관리" color="#d32f2f" onPress={() => setShowAccountModal(true)} />
            </View>
          </View>
        )}
      </View>
      {/* 계정 관리 모달 */}
      <Modal visible={showAccountModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, width: 320, maxHeight: '80%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>계정 관리</Text>
            
            {/* 생체인증 상태 표시 */}
            <View style={{ marginBottom: 20, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>생체인증 상태</Text>
              {biometricStatus.isAvailable ? (
                <>
                  <Text style={{ marginBottom: 4 }}>
                    지원 유형: {biometricStatus.supportedTypes.join(', ')}
                  </Text>
                  <Text style={{ marginBottom: 8 }}>
                    상태: {biometricStatus.isEnabled ? '활성화됨' : '비활성화됨'}
                  </Text>
                  {biometricStatus.isEnabled ? (
                    <Button title="생체인증 비활성화" onPress={handleDisableBiometric} color="#d32f2f" />
                  ) : (
                    <Button title="생체인증 활성화" onPress={handleEnableBiometric} color="#4CAF50" />
                  )}
                </>
              ) : (
                <Text style={{ color: '#666' }}>이 기기는 생체인증을 지원하지 않습니다.</Text>
              )}
            </View>

            <Text style={{ marginBottom: 12 }}>비밀번호를 입력하세요.</Text>
            <TextInput
              value={accountPassword}
              onChangeText={setAccountPassword}
              placeholder="비밀번호"
              secureTextEntry
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16 }}
            />
            <Button title="정보 초기화" onPress={handleAccountReset} disabled={modalLoading} />
            <View style={{ height: 12 }} />
            <Button title="계정 완전 삭제" color="#d32f2f" onPress={handleAccountDelete} disabled={modalLoading} />
            <View style={{ height: 12 }} />
            <Button title="닫기" onPress={() => setShowAccountModal(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, padding: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderColor: '#007AFF' },
  tabText: { fontSize: 16, color: '#888' },
  activeTabText: { color: '#007AFF', fontWeight: 'bold' },
  container: { padding: 24, flex: 1 },
  loadingText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { textAlign: 'center', marginBottom: 20, fontSize: 16, color: '#d32f2f' },
}); 