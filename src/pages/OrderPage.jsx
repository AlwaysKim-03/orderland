import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import OrderSummaryModal from '../components/OrderSummaryModal';
import styles from './OrderPage.module.css';
import { db } from '../firebase'; // Firebase db 객체 가져오기
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy } from 'firebase/firestore';

function getTableKey(storeSlug, tableId) {
  return `${storeSlug}-Table-${String(tableId).replace(/^table-/, '')}`;
}

function OrderHistoryModal({ isOpen, onClose, orderHistory }) {
  if (!isOpen) return null;
  // 누적 총액 계산
  const totalOrderAmount = orderHistory.reduce((sum, order) => {
    const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.orders) ? order.orders : []);
    return sum + items.reduce((s, item) => s + Number(item.price) * Number(item.quantity || 1), 0);
  }, 0);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>총 주문내역</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>
        {orderHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>주문 내역이 없습니다.</div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {orderHistory.map((order, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>주문일시: {order.date ? new Date(order.date).toLocaleString() : '-'}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {(order.items || order.orders || []).map((item, i) => (
                    <li key={i} style={{ fontSize: 15, color: '#222', marginBottom: 2 }}>
                      {safeDecode(item.name)} x {item.count ?? item.quantity ?? 1}개{item.price ? ` (${Number(item.price).toLocaleString()}원)` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.2em', marginTop: 24 }}>
              누적 총액: {totalOrderAmount.toLocaleString()}원
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 음식 이름 디코딩 함수 추가
function safeDecode(name) {
  try {
    // "uce6d ub530uc624" → "한글"
    if (/^(u[0-9a-fA-F]{4}\s*)+$/.test(name)) {
      return name.split(' ').map(part =>
        part.replace(/u([0-9a-fA-F]{4})/g, (match, grp) =>
          String.fromCharCode(parseInt(grp, 16))
        )
      ).join('');
    }
    // URL 인코딩 → 한글
    if (/^%[0-9A-Fa-f]{2}/.test(name)) return decodeURIComponent(name);
    return name;
  } catch {
    return name;
  }
}

function toSlug(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, '-');
}

function getCategoryDisplayName(categoryName, storeSlug) {
  const decoded = decodeURIComponent(categoryName);
  if (decoded.startsWith(storeSlug + '_')) {
    return decoded.slice(storeSlug.length + 1);
  }
  const parts = decoded.split('_');
  return parts[parts.length - 1];
}

function displayName(slug, storeSlug = '') {
  let name = decodeURIComponent(String(slug));
  if (storeSlug && name.startsWith(storeSlug + '_')) {
    name = name.replace(storeSlug + '_', '');
  }
  return name.replace(/-/g, ' ');
}

export default function OrderPage() {
  const params = useParams();
  const storeSlug = params.storeSlug;
  const storeName = storeSlug.replace(/-/g, ' '); // URL 슬러그를 원래 가게 이름으로 변환
  const tableId = Number(params.tableId.replace('table-', ''));
  
  const [storeId, setStoreId] = useState(null); // 가게 주인의 user.uid
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuQuantities, setMenuQuantities] = useState({});

  // storeName을 기반으로 storeId(user.uid)를 찾는 로직
  const fetchStoreId = useCallback(async () => {
    try {
      const q = query(collection(db, "users"), where("store_name", "==", storeName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const storeOwner = querySnapshot.docs[0];
        setStoreId(storeOwner.id);
      } else {
        setError('가게 정보를 찾을 수 없습니다.');
        setLoading(false);
      }
    } catch (err) {
      console.error("가게 ID 조회 실패:", err);
      setError('가게 정보를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [storeName]);

  useEffect(() => {
    fetchStoreId();
  }, [fetchStoreId]);

  // 카테고리 정보 가져오기 (Firestore)
  useEffect(() => {
    if (!storeId) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "categories"), where("storeId", "==", storeId), orderBy("createdAt"));
        const querySnapshot = await getDocs(q);
        const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(fetchedCategories);
        if(fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0]);
        }
        if(fetchedCategories.length === 0) {
          setLoading(false); // 상품을 가져올 카테고리가 없으므로 로딩 종료
        }
      } catch (error) {
        console.error('Firestore 카테고리 로딩 실패:', error);
        setError('카테고리를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };
    fetchCategories();
  }, [storeId]);

  // 메뉴 정보 가져오기 (Firestore)
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "products"), 
          where("storeId", "==", storeId), 
          where("category", "==", selectedCategory.name)
        );
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Firestore 상품 로딩 실패:', error);
        setError('메뉴를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false); // 메뉴 로딩이 끝나면 로딩 상태 해제
      }
    };
    fetchProducts();
  }, [selectedCategory, storeId]);

  // 주문내역 실시간으로 불러오기 (Firestore)
  useEffect(() => {
    if (!storeId) return;
    
    const q = query(
      collection(db, "orders"), 
      where("storeId", "==", storeId), 
      where("tableNumber", "==", tableId),
      where("status", "in", ["new", "processing"])
    );

    // onSnapshot을 사용하여 실시간으로 주문 변경을 감지
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Firestore timestamp를 JS Date 객체로 변환
        date: doc.data().createdAt?.toDate() 
      }));
      setOrderHistory(fetchedOrders);
    }, (err) => {
      console.error('주문내역 실시간 수신 실패:', err);
      setError('주문 내역을 불러오는 데 실패했습니다.');
    });

    // 컴포넌트가 언마운트될 때 리스너 정리
    return () => unsubscribe();
  }, [storeId, tableId]);

  // 수량 변경 핸들러
  const handleQuantityChange = (menuId, delta) => {
    setMenuQuantities(prev => {
      const current = prev[menuId] || 1;
      const next = current + delta;
      if (next < 1) return { ...prev, [menuId]: 1 };
      return { ...prev, [menuId]: next };
    });
  };

  // 주문하기(장바구니에 추가)
  const handleAddToCart = (menu) => {
    const quantity = menuQuantities[menu.id] || 1;
    setCart(prev => {
      const exists = prev.find(item => item.id === menu.id);
      if (exists) {
        return prev.map(item => item.id === menu.id ? { ...item, count: item.count + quantity } : item);
      } else {
        return [...prev, { ...menu, price: Number(menu.price), count: quantity }];
      }
    });
    setMenuQuantities(prev => ({ ...prev, [menu.id]: 1 }));
  };

  // 장바구니에서 메뉴 제거
  const removeFromCart = (menuId) => {
    if (menuId === 'all') {
      setCart([]);
    } else {
      setCart(prev => prev.filter(item => item.id !== menuId));
    }
  };

  const handleUpdateCartQuantity = (menuId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(menuId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === menuId ? { ...item, count: newQuantity } : item
        )
      );
    }
  };

  // 주문 제출 함수 원복
  const handleOrderSubmit = async () => {
    if (cart.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    if (!storeId) {
      alert('가게 정보가 올바르지 않아 주문할 수 없습니다.');
      return;
    }
    try {
      const orderData = {
        storeId: storeId,
        tableNumber: tableId,
        items: cart.map(item => ({
          id: item.id, // product id
          name: item.name,
          category: item.category || '',
          price: Number(item.price),
          quantity: Number(item.count)
        })),
        totalAmount: cart.reduce((sum, item) => sum + item.count * Number(item.price), 0),
        status: 'new', // 'new', 'processing', 'completed'
        createdAt: new Date()
      };
      await addDoc(collection(db, "orders"), orderData);
      setCart([]);
      setIsCartOpen(false);
      alert('주문이 접수되었습니다!');
    } catch (err) {
      console.error("Firestore 주문 제출 실패:", err);
      alert('주문 실패: ' + err.message);
    }
  };

  const handleCallStaff = async () => {
    if (!storeId || !tableId) {
      alert("오류: 가게 또는 테이블 정보가 없습니다.");
      return;
    }
    try {
      await addDoc(collection(db, "staff_calls"), {
        storeId,
        tableNumber: tableId,
        message: '직원 호출',
        status: 'new',
        createdAt: new Date(),
      });
      alert('직원을 호출했습니다. 잠시만 기다려주세요.');
    } catch(err) {
      console.error('직원 호출 실패:', err);
      alert('오류가 발생하여 직원을 호출하지 못했습니다.');
    }
  };

  // 장바구니 총액 계산
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.count, 0);

  if (loading && products.length === 0) {
    return <div className={styles.loadingContainer}>메뉴를 불러오는 중...</div>;
  }

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.storeName}>{storeName}</h1>
            <p className={styles.tableName}>테이블 {tableId}</p>
          </div>
          <div className={styles.headerActions}>
            <button onClick={handleCallStaff} className={styles.callButton}>직원 호출</button>
            <button onClick={() => setIsCartOpen(true)} className={styles.cartButton}>
              <span>장바구니</span>
              {cart.length > 0 && (
                <span className={styles.cartCount}>{cart.length}</span>
              )}
            </button>
          </div>
        </div>
        <div className={styles.categoryContainer}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoryButton} ${selectedCategory?.id === cat.id ? styles.active : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <main className={styles.menuGrid}>
        {products.map(menu => (
          <div key={menu.id} className={styles.menuItem}>
            <img
              src={menu.imageUrl && menu.imageUrl.trim() ? menu.imageUrl : 'https://via.placeholder.com/300x200'}
              alt={menu.name}
              className={styles.menuImage}
            />
            <div className={styles.menuInfo}>
              <h3 className={styles.menuName}>{safeDecode(menu.name)}</h3>
              <p className={styles.menuPrice}>{Number(menu.price).toLocaleString()}원</p>
            </div>
            <div className={styles.menuActions}>
              <div className={styles.quantityControl}>
                <button onClick={() => handleQuantityChange(menu.id, -1)}>-</button>
                <span>{menuQuantities[menu.id] || 1}</span>
                <button onClick={() => handleQuantityChange(menu.id, 1)}>+</button>
              </div>
              <button className={styles.addButton} onClick={() => handleAddToCart(menu)}>담기</button>
            </div>
          </div>
        ))}
      </main>
      
      <button className={styles.historyButton} onClick={() => setIsHistoryOpen(true)}>
        총 주문내역
      </button>

      <OrderSummaryModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        orders={cart}
        onRemoveOrder={removeFromCart}
        onOrder={handleOrderSubmit}
        onUpdateQuantity={handleUpdateCartQuantity}
        storeId={storeId}
        tableId={tableId}
      />
      
      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orderHistory={orderHistory}
      />
    </div>
  );
} 