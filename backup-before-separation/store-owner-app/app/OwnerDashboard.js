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
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

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

  // Firebase 연결 상태 확인 및 재연결
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkFirestoreConnection();
        if (!isConnected) {
          console.log('Firebase 연결이 끊어졌습니다. 재연결을 시도합니다...');
          await reconnectFirestore();
        }
      } catch (error) {
        console.error('Firebase 연결 확인 실패:', error);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // 30초마다 확인
    return () => clearInterval(interval);
  }, []);

  // 사용자 정보 로드
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserInfo({ uid: user.uid, ...userDoc.data() });
          } else {
            setUserInfo({ uid: user.uid, email: user.email });
          }
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
          setError('사용자 정보를 불러오는데 실패했습니다.');
        }
      } else {
        setUserInfo(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 실시간 주문 데이터 구독
  useEffect(() => {
    if (!userInfo?.uid) return;

    const setupOrderSubscription = () => {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('storeId', '==', userInfo.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
          const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRealtimeOrders(orders);
        }, (error) => {
          console.error('주문 데이터 구독 실패:', error);
        });

        return unsubscribe;
      } catch (error) {
        console.error('주문 구독 설정 실패:', error);
        return () => {};
      }
    };

    const unsubscribe = setupOrderSubscription();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userInfo?.uid]);

  // 생체인증 상태 초기 확인
  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const handleStoreUpdate = async (newInfo) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...newInfo,
        updatedAt: new Date()
      });

      setUserInfo(prev => ({ ...prev, ...newInfo }));
      Alert.alert('성공', '매장 정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('매장 정보 업데이트 실패:', error);
      Alert.alert('오류', '매장 정보 업데이트에 실패했습니다.');
    }
  };

  const handleAcknowledgeOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        acknowledged: true,
        acknowledgedAt: new Date()
      });
      Alert.alert('성공', '주문이 확인되었습니다.');
    } catch (error) {
      console.error('주문 확인 실패:', error);
      Alert.alert('오류', '주문 확인에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert('오류', '로그인이 필요합니다.');
                return;
              }

              // 사용자의 모든 데이터 삭제
              const batch = writeBatch(db);
              
              // 주문 데이터 삭제
              const ordersQuery = query(collection(db, 'orders'), where('storeId', '==', user.uid));
              const ordersSnapshot = await getDocs(ordersQuery);
              ordersSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
              });

              // 메뉴 데이터 삭제
              const menusQuery = query(collection(db, 'menus'), where('storeId', '==', user.uid));
              const menusSnapshot = await getDocs(menusQuery);
              menusSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
              });

              // 카테고리 데이터 삭제
              const categoriesQuery = query(collection(db, 'categories'), where('storeId', '==', user.uid));
              const categoriesSnapshot = await getDocs(categoriesQuery);
              categoriesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
              });

              // 사용자 정보 삭제
              batch.delete(doc(db, 'users', user.uid));

              await batch.commit();
              await deleteUser(user);
              
              Alert.alert('성공', '계정이 삭제되었습니다.');
              onLogout();
            } catch (error) {
              console.error('계정 삭제 실패:', error);
              Alert.alert('오류', '계정 삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('성공', '로그아웃되었습니다.');
      onLogout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
      Alert.alert('오류', '로그아웃에 실패했습니다.');
    }
  };

  const handleAccountReset = async () => {
    if (!accountPassword.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 비밀번호 재설정 이메일 전송
      await firebase.auth().sendPasswordResetEmail(user.email);
      
      Alert.alert('성공', '비밀번호 재설정 이메일이 전송되었습니다.');
      setAccountPassword('');
      setShowAccountModal(false);
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
      Alert.alert('오류', '비밀번호 재설정에 실패했습니다.');
    }
  };

  const handleAccountDelete = async () => {
    if (!accountPassword.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 사용자 재인증
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, accountPassword);
      await user.reauthenticateWithCredential(credential);

      // 계정 삭제 진행
      await handleDeleteAccount();
    } catch (error) {
      console.error('계정 삭제 실패:', error);
      Alert.alert('오류', '비밀번호가 올바르지 않거나 계정 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!userInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>로그인이 필요합니다.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/login')}>
            <Text style={styles.retryButtonText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.storeInfo}>
            <Text style={styles.storeIcon}>🏪</Text>
            <View style={styles.storeDetails}>
              <Text style={styles.storeName}>{userInfo.storeName || '오더랜드'}</Text>
              <Text style={styles.storeStatus}>영업중</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="add" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton}>
              <Text style={styles.avatarText}>
                {userInfo.storeName ? userInfo.storeName.charAt(0) : 'O'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Analytics Cards */}
      <View style={styles.analyticsContainer}>
        <Text style={styles.analyticsTitle}>가게 분석</Text>
        <Text style={styles.analyticsSubtitle}>지난 24시간</Text>
        
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsCardContent}>
              <Ionicons name="trending-up" size={32} color="#FF914D" />
              <View style={styles.analyticsCardText}>
                <Text style={styles.analyticsCardValue}>₩157,000</Text>
                <Text style={styles.analyticsCardLabel}>오늘 매출</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsCardContent}>
              <MaterialIcons name="inventory" size={32} color="#FDC84A" />
              <View style={styles.analyticsCardText}>
                <Text style={styles.analyticsCardValue}>15건</Text>
                <Text style={styles.analyticsCardLabel}>총 주문 수</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tabName, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tab, tab === index && styles.tabActive]}
              onPress={() => handleTabChange(index)}
            >
              <Text style={[styles.tabText, tab === index && styles.tabTextActive]}>
                {tabName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {tab === 0 && <StoreInfoForm userInfo={userInfo} onUpdate={handleStoreUpdate} />}
        {tab === 1 && <OrderList orders={realtimeOrders} onAcknowledge={handleAcknowledgeOrder} />}
        {tab === 2 && <SalesInfo orders={realtimeOrders} />}
        {tab === 3 && <MenuManager />}
      </View>

      {/* Account Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>계정 관리</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>생체인증</Text>
              <View style={styles.biometricSection}>
                <View style={styles.biometricInfo}>
                  <Text style={styles.biometricStatus}>
                    {biometricStatus.isEnabled ? '활성화됨' : '비활성화됨'}
                  </Text>
                  <Text style={styles.biometricDescription}>
                    {biometricStatus.isEnabled 
                      ? '생체인증으로 빠르게 로그인할 수 있습니다.'
                      : '생체인증을 활성화하여 빠른 로그인을 사용하세요.'
                    }
                  </Text>
                </View>
                
                {biometricStatus.isEnabled ? (
                  <TouchableOpacity
                    style={styles.disableBiometricButton}
                    onPress={handleDisableBiometric}
                  >
                    <Text style={styles.disableBiometricButtonText}>비활성화</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.enableBiometricButton}
                    onPress={handleEnableBiometric}
                  >
                    <Text style={styles.enableBiometricButtonText}>활성화</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>계정 보안</Text>
              <TouchableOpacity
                style={styles.securityButton}
                onPress={() => {
                  setShowAccountModal(false);
                  // 비밀번호 재설정 모달 열기
                }}
              >
                <Text style={styles.securityButtonText}>비밀번호 변경</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>계정 삭제</Text>
              <TouchableOpacity
                style={styles.deleteAccountButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.deleteAccountButtonText}>계정 삭제</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAccountModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  storeStatus: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  analyticsContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  analyticsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyticsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  analyticsCardText: {
    marginLeft: 12,
  },
  analyticsCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  analyticsCardLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  biometricSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  biometricInfo: {
    flex: 1,
  },
  biometricStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  biometricDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  enableBiometricButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  enableBiometricButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  disableBiometricButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  disableBiometricButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  securityButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  securityButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  deleteAccountButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  deleteAccountButtonText: {
    fontSize: 14,
    color: '#EF4444',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  logoutButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
}); 