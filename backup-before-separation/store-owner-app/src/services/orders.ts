import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// 주문 타입 정의
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  options?: string[];
  notes?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  guests: number;
  orderTime: Timestamp;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  storeId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Table {
  id: string;
  number: number;
  status: 'empty' | 'occupied' | 'served';
  guests?: number;
  orderTime?: Timestamp;
  currentOrderId?: string;
  storeId: string;
}

// 주문 생성
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const orderRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return orderRef.id;
  } catch (error: any) {
    throw new Error(`주문 생성 실패: ${error.message}`);
  }
};

// 주문 조회
export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() } as Order;
    }
    return null;
  } catch (error: any) {
    throw new Error(`주문 조회 실패: ${error.message}`);
  }
};

// 매장의 모든 주문 조회
export const getStoreOrders = async (storeId: string): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
  } catch (error: any) {
    throw new Error(`매장 주문 조회 실패: ${error.message}`);
  }
};

// 오늘 주문 조회
export const getTodayOrders = async (storeId: string): Promise<Order[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersQuery = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
  } catch (error: any) {
    throw new Error(`오늘 주문 조회 실패: ${error.message}`);
  }
};

// 주문 상태 업데이트
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`주문 상태 업데이트 실패: ${error.message}`);
  }
};

// 주문 아이템 상태 업데이트
export const updateOrderItemStatus = async (orderId: string, itemId: string, status: OrderItem['status']): Promise<void> => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (!orderDoc.exists()) {
      throw new Error('주문을 찾을 수 없습니다.');
    }
    
    const order = orderDoc.data() as Order;
    const updatedItems = order.items.map(item => 
      item.id === itemId ? { ...item, status } : item
    );
    
    await updateDoc(doc(db, 'orders', orderId), {
      items: updatedItems,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`주문 아이템 상태 업데이트 실패: ${error.message}`);
  }
};

// 주문 삭제
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error: any) {
    throw new Error(`주문 삭제 실패: ${error.message}`);
  }
};

// 테이블 생성
export const createTable = async (tableData: Omit<Table, 'id'>): Promise<string> => {
  try {
    const tableRef = await addDoc(collection(db, 'tables'), tableData);
    return tableRef.id;
  } catch (error: any) {
    throw new Error(`테이블 생성 실패: ${error.message}`);
  }
};

// 매장의 모든 테이블 조회
export const getStoreTables = async (storeId: string): Promise<Table[]> => {
  try {
    const tablesQuery = query(
      collection(db, 'tables'),
      where('storeId', '==', storeId),
      orderBy('number', 'asc')
    );
    
    const querySnapshot = await getDocs(tablesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Table);
  } catch (error: any) {
    throw new Error(`매장 테이블 조회 실패: ${error.message}`);
  }
};

// 테이블 상태 업데이트
export const updateTableStatus = async (tableId: string, status: Table['status'], orderId?: string): Promise<void> => {
  try {
    const updateData: any = { status };
    if (orderId) {
      updateData.currentOrderId = orderId;
    }
    
    await updateDoc(doc(db, 'tables', tableId), updateData);
  } catch (error: any) {
    throw new Error(`테이블 상태 업데이트 실패: ${error.message}`);
  }
};

// 실시간 주문 리스너
export const subscribeToOrders = (storeId: string, callback: (orders: Order[]) => void) => {
  const ordersQuery = query(
    collection(db, 'orders'),
    where('storeId', '==', storeId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(ordersQuery, (querySnapshot) => {
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order);
    callback(orders);
  });
};

// 실시간 테이블 리스너
export const subscribeToTables = (storeId: string, callback: (tables: Table[]) => void) => {
  const tablesQuery = query(
    collection(db, 'tables'),
    where('storeId', '==', storeId),
    orderBy('number', 'asc')
  );
  
  return onSnapshot(tablesQuery, (querySnapshot) => {
    const tables = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Table);
    callback(tables);
  });
};

// 매장 통계 계산
export const getStoreStats = async (storeId: string): Promise<{
  todaySales: number;
  totalOrders: number;
  occupiedTables: number;
  totalTables: number;
}> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 오늘 주문 조회
    const ordersQuery = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      where('createdAt', '>=', Timestamp.fromDate(today))
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const todayOrders = ordersSnapshot.docs.map(doc => doc.data() as Order);
    
    // 테이블 조회
    const tablesQuery = query(
      collection(db, 'tables'),
      where('storeId', '==', storeId)
    );
    
    const tablesSnapshot = await getDocs(tablesQuery);
    const tables = tablesSnapshot.docs.map(doc => doc.data() as Table);
    
    const todaySales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = todayOrders.length;
    const occupiedTables = tables.filter(table => table.status === 'occupied').length;
    const totalTables = tables.length;
    
    return {
      todaySales,
      totalOrders,
      occupiedTables,
      totalTables,
    };
  } catch (error: any) {
    throw new Error(`매장 통계 조회 실패: ${error.message}`);
  }
}; 