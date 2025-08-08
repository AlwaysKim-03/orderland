import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Button, 
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';

export default function OrderDetailModal({ 
  isVisible, 
  onClose, 
  tableNumber, 
  orders = [] 
}) {
  const [menuList, setMenuList] = useState([]);
  const [menuQuantities, setMenuQuantities] = useState({});
  const [loading, setLoading] = useState(false);

  // 메뉴 리스트 불러오기
  useEffect(() => {
    if (!isVisible) return;
    
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "products"), 
          where("storeId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedMenus = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setMenuList(fetchedMenus);
      } catch (err) {
        console.error("메뉴 불러오기 실패:", err);
        Alert.alert('오류', '메뉴를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenus();
  }, [isVisible]);

  // 주문 아이템 추출 함수 (웹앱과 동일)
  const getOrderItems = (order) => {
    if (Array.isArray(order.items)) return order.items;
    if (typeof order.items === 'string') {
      try { return JSON.parse(order.items); } catch { return []; }
    }
    return [];
  };

  // 총액 계산
  const total = orders.reduce((sum, order) => {
    const items = getOrderItems(order);
    return sum + items.reduce((s, item) => s + Number(item.price) * Number(item.quantity || 1), 0);
  }, 0);

  // 메뉴 추가 (기존 주문에 아이템 추가 또는 새 주문 생성)
  const handleAddMenu = async (menu) => {
    const qty = Math.max(1, Number(menuQuantities[menu.id]) || 1);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 기존 주문이 있을 경우
      if (orders.length > 0) {
        const primaryOrder = orders[0]; // 가장 최근 주문에 추가
        const orderRef = doc(db, "orders", primaryOrder.id);
        
        const currentItems = getOrderItems(primaryOrder);
        const newItems = [...currentItems, { 
          id: menu.id, 
          name: menu.name, 
          price: Number(menu.price), 
          quantity: qty 
        }];
        const newTotal = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        await updateDoc(orderRef, {
          items: newItems,
          totalAmount: newTotal,
        });
        
        Alert.alert('성공', '메뉴가 추가되었습니다.');
      } else {
        // 기존 주문이 없을 경우 새 주문 생성
        await addDoc(collection(db, "orders"), {
          storeId: user.uid,
          tableNumber: tableNumber,
          items: [{ 
            id: menu.id, 
            name: menu.name, 
            price: Number(menu.price), 
            quantity: qty 
          }],
          totalAmount: Number(menu.price) * qty,
          status: 'new',
          createdAt: new Date(),
        });
        
        Alert.alert('성공', '새 주문이 생성되었습니다.');
      }
      
      // 수량 초기화
      setMenuQuantities({});
    } catch (err) {
      console.error("메뉴 추가 실패:", err);
      Alert.alert('오류', '메뉴 추가에 실패했습니다.');
    }
  };

  // 계산 완료 (주문 상태 변경 및 초기화)
  const handleCheckout = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 모든 주문을 completed 상태로 변경
      for (const order of orders) {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, {
          status: 'completed',
          completedAt: new Date()
        });
      }

      Alert.alert('성공', '계산이 완료되었습니다.');
      onClose();
    } catch (err) {
      console.error("계산 완료 실패:", err);
      Alert.alert('오류', '계산 완료 처리에 실패했습니다.');
    }
  };

  // 주문 아이템 삭제
  const handleDeleteOrderItem = async (orderId, itemIndex) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const orderRef = doc(db, "orders", orderId);
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const currentItems = getOrderItems(order);
      const updatedItems = currentItems.filter((_, index) => index !== itemIndex);
      
      if (updatedItems.length === 0) {
        // 모든 아이템이 삭제되면 주문도 삭제
        await deleteDoc(orderRef);
        Alert.alert('성공', '주문이 삭제되었습니다.');
      } else {
        // 아이템만 삭제하고 총액 업데이트
        const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await updateDoc(orderRef, {
          items: updatedItems,
          totalAmount: newTotal,
        });
        Alert.alert('성공', '메뉴가 삭제되었습니다.');
      }
    } catch (err) {
      console.error("메뉴 삭제 실패:", err);
      Alert.alert('오류', '메뉴 삭제에 실패했습니다.');
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{tableNumber}번 테이블 주문 관리</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* 왼쪽: 주문내역 */}
          <View style={styles.leftPane}>
            <Text style={styles.sectionTitle}>주문내역 (테이블 {tableNumber})</Text>
            <ScrollView style={styles.orderList}>
              {orders.length === 0 ? (
                <Text style={styles.noOrderText}>주문이 없습니다.</Text>
              ) : (
                orders.map((order) => 
                  getOrderItems(order).map((item, i) => (
                    <View key={`${order.id}-${i}`} style={styles.orderItem}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.itemName}>{item.name} x {item.quantity}</Text>
                        <Text style={styles.itemPrice}>
                          {(item.price * item.quantity).toLocaleString()}원
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteOrderItem(order.id, i)}
                      >
                        <Text style={styles.deleteButtonText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )
              )}
            </ScrollView>
            <View style={styles.totalSection}>
              <Text style={styles.totalText}>총액: {total.toLocaleString()}원</Text>
            </View>
          </View>

          {/* 오른쪽: 메뉴 추가 */}
          <View style={styles.rightPane}>
            <Text style={styles.sectionTitle}>메뉴 추가</Text>
            {loading ? (
              <Text style={styles.loadingText}>메뉴를 불러오는 중...</Text>
            ) : menuList.length === 0 ? (
              <Text style={styles.noMenuText}>등록된 메뉴가 없습니다.</Text>
            ) : (
              <ScrollView style={styles.menuList}>
                {menuList.map((menu) => (
                  <View key={menu.id} style={styles.menuItem}>
                    <View style={styles.menuInfo}>
                      <Text style={styles.menuName}>{menu.name}</Text>
                      <Text style={styles.menuPrice}>{menu.price?.toLocaleString()}원</Text>
                    </View>
                    <View style={styles.quantitySection}>
                      <TextInput
                        style={styles.quantityInput}
                        placeholder="수량"
                        keyboardType="numeric"
                        value={menuQuantities[menu.id]?.toString() || '1'}
                        onChangeText={(text) => setMenuQuantities(prev => ({
                          ...prev,
                          [menu.id]: Math.max(1, parseInt(text) || 1)
                        }))}
                      />
                      <Button
                        title="추가"
                        onPress={() => handleAddMenu(menu)}
                        color="#007AFF"
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            
            {/* 계산 완료 버튼 */}
            <View style={styles.checkoutSection}>
              <Button
                title="계산 완료"
                onPress={handleCheckout}
                color="#22c55e"
                disabled={orders.length === 0}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    padding: 20,
  },
  rightPane: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  orderList: {
    flex: 1,
  },
  noOrderText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  orderItemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 5,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#333',
  },
  menuList: {
    flex: 1,
  },
  loadingText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  noMenuText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  menuItem: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  menuInfo: {
    marginBottom: 8,
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  menuPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: 'center',
  },
  checkoutSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
}); 