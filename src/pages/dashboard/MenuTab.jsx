import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth, storage } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc,
  updateDoc,
  orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- 스타일 컴포넌트 ---
const styles = {
  container: { display: 'flex', gap: '30px', padding: '20px', fontFamily: 'sans-serif', background: '#f8fafc', height: 'calc(100vh - 200px)' },
  sidebar: { width: '250px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
  mainContent: { flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  categoryList: { listStyle: 'none', padding: 0, margin: 0, flex: 1 },
  categoryItem: (isSelected) => ({
    padding: '12px 15px',
    marginBottom: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    backgroundColor: isSelected ? '#3b82f6' : 'transparent',
    color: isSelected ? '#fff' : '#334155',
    transition: 'all 0.2s',
  }),
  button: {
    padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  th: { borderBottom: '2px solid #e2e8f0', padding: '12px', textAlign: 'left', color: '#64748b' },
  td: { borderBottom: '1px solid #f1f5f9', padding: '12px' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '15px' },
  select: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '15px', background: '#fff' },
  imagePreview: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '10px' },
  menuImage: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' },
};

// Helper function to create slugs
function toSlug(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/\s+/g, '-');
}

export default function MenuTab({ categories, products, onMenuUpdate }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);

  // 첫 번째 카테고리를 기본으로 선택
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    } else if (categories.length > 0 && activeCategory) {
      // 카테고리 목록이 변경되었을 때, 현재 선택된 activeCategory가 여전히 유효한지 확인
      const updatedActiveCategory = categories.find(c => c.id === activeCategory.id);
      if (updatedActiveCategory) {
        setActiveCategory(updatedActiveCategory);
      } else {
        setActiveCategory(categories[0]);
      }
    } else if (categories.length === 0) {
      setActiveCategory(null);
    }
  }, [categories, activeCategory]);

  // --- Event Handlers ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await addDoc(collection(db, "categories"), {
        name: newCategoryName,
        storeId: currentUser.uid,
        createdAt: new Date(),
      });
      setNewCategoryName("");
      onMenuUpdate(); // 데이터 리프레시
    } catch (error) {
      console.error("카테고리 추가 실패: ", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("카테고리를 삭제하면 속한 메뉴도 모두 삭제됩니다. 계속하시겠습니까?")) return;
    // ... (삭제 로직은 동일, 마지막에 onMenuUpdate() 호출)
    try {
      // Firestore 트랜잭션을 사용하면 더 안전하지만, 우선 개별 삭제로 구현
      // 1. 카테고리에 속한 상품들 삭제
      const productsToDelete = products.filter(p => p.category === activeCategory.name);
      for (const product of productsToDelete) {
        await deleteDoc(doc(db, "products", product.id));
      }
      // 2. 카테고리 삭제
      await deleteDoc(doc(db, "categories", categoryId));
      onMenuUpdate();
    } catch (error) {
      console.error("카테고리 삭제 실패:", error);
    }
  };
  
  // (생략) ... handleUpdateCategory, handleAddProduct, handleUpdateProduct, handleDeleteProduct 등
  // 모든 CUD(Create, Update, Delete) 함수의 마지막에 onMenuUpdate()를 호출하도록 수정합니다.
  
  // --- Filtered Menus ---
  const filteredMenus = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter(menu => menu.category === activeCategory.name);
  }, [products, activeCategory]);

  return (
    <div style={styles.container}>
      {/* Left Sidebar: Categories */}
      <aside style={styles.sidebar}>
        <h3 style={{ marginTop: 0 }}>카테고리</h3>
        <ul style={styles.categoryList}>
          <li style={styles.categoryItem(activeCategory === null)} onClick={() => setActiveCategory(null)}>전체 메뉴</li>
          {categories.map(cat => (
            <li key={cat.id} style={{...styles.categoryItem(activeCategory?.id === cat.id), display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} onClick={() => setActiveCategory(cat)}>
                    {cat.name}
                </span>
                <button 
                    title={`${cat.name} 카테고리 삭제`}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', paddingLeft: '10px', fontWeight: 'bold' }}
                    onClick={() => handleDeleteCategory(cat.id)}>
                    삭제
                </button>
            </li>
          ))}
        </ul>
        <button style={{...styles.button, background: '#10b981'}} onClick={() => setEditingCategory(null)}>+ 새 카테고리</button>
      </aside>

      {/* Main Content: Menus */}
      <main style={styles.mainContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0 }}>
            {activeCategory ? `${activeCategory.name} 메뉴` : '전체 메뉴'} ({filteredMenus.length})
          </h3>
          <button style={styles.button} onClick={() => setEditingProduct(null)}>+ 새 메뉴 추가</button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th, width: '80px'}}>사진</th>
              <th style={styles.th}>이름</th><th style={styles.th}>가격</th><th style={styles.th}>카테고리</th><th style={styles.th}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredMenus.map((menu) => (
              <tr key={menu.id}>
                <td style={styles.td}>
                  {menu.imageUrl ? (
                    <img src={menu.imageUrl} alt={menu.name} style={styles.menuImage} />
                  ) : (
                    <div style={{...styles.menuImage, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px'}}>No img</div>
                  )}
                </td>
                <td style={styles.td}>{menu.name}</td>
                <td style={styles.td}>{menu.price.toLocaleString()}원</td>
                <td style={styles.td}>{menu.category}</td>
                <td style={styles.td}>
                  <button onClick={() => setEditingProduct(menu)} style={{marginRight: '8px'}}>수정</button>
                  <button onClick={async () => {
                      if (!window.confirm("정말로 메뉴를 삭제하시겠습니까?")) return;
                      await deleteDoc(doc(db, "products", menu.id));
                      onMenuUpdate();
                  }}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* Category Add/Edit Modal */}
      {editingCategory && (
        <CategoryModal 
          isOpen={editingCategory !== null}
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
          onSave={onMenuUpdate}
        />
      )}
    </div>
  );
}

// --- Sub-component: CategoryModal ---
function CategoryModal({ isOpen, onClose, category, onSave }) {
    const [name, setName] = useState('');

    useEffect(() => {
        if (category) {
            setName(category.name);
        } else {
            setName('');
        }
    }, [category, isOpen]);

    const handleSave = async () => {
        if (!name.trim()) return alert('카테고리 이름을 입력하세요.');
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const categoryData = {
                name,
                storeId: currentUser.uid,
                createdAt: new Date()
            };

            if (category) {
                await updateDoc(doc(db, "categories", category.id), categoryData);
            } else {
                await addDoc(collection(db, "categories"), categoryData);
            }
            onSave();
            onClose();
        } catch(err) {
            alert('카테고리 저장에 실패했습니다.');
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <h3 style={{marginTop: 0}}>{category ? '카테고리 수정' : '새 카테고리 추가'}</h3>
                <label>카테고리 이름</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="카테고리 이름"
                    style={styles.input}
                />
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                    <button onClick={onClose}>취소</button>
                    <button style={styles.button} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
} 