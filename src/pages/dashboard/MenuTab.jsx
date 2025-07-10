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

// Firebase Storage 이미지 업로드 공식 예제 함수
async function uploadMenuImage(file, userId, storage) {
  const imageRef = ref(storage, `products/${userId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(imageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// --- ProductModal 컴포넌트 ---
function ProductModal({ isOpen, onClose, product, categories, onSave, onDelete }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name);
        setPrice(product.price);
        setCategory(product.category);
        setImageUrl(product.imageUrl || '');
      } else {
        setName('');
        setPrice('');
        setCategory(categories.length > 0 ? categories[0].name : '');
        setImageUrl('');
      }
      setImageFile(null);
    }
  }, [isOpen, product, categories]);

  const handleSave = async () => {
    if (!name.trim() || !price || !category) return alert('모든 필드를 입력하세요.');
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      let uploadedImageUrl = product?.imageUrl || '';
      if (imageFile) {
        console.log('[이미지 업로드] 파일 선택됨:', imageFile);
        try {
          console.log('[이미지 업로드] 업로드 시작');
          uploadedImageUrl = await uploadMenuImage(imageFile, currentUser.uid, storage);
          console.log('[이미지 업로드] 업로드 성공, URL:', uploadedImageUrl);
        } catch (uploadErr) {
          console.error('[이미지 업로드] 업로드 실패:', uploadErr);
          alert('이미지 업로드에 실패했습니다.');
          return;
        }
      }
      const productData = {
        name,
        price: Number(price),
        category,
        storeId: currentUser.uid,
        imageUrl: uploadedImageUrl,
      };
      try {
        if (product) {
          console.log('[Firestore] 기존 메뉴 수정:', product.id, productData);
          await updateDoc(doc(db, "products", product.id), productData);
        } else {
          console.log('[Firestore] 새 메뉴 추가:', productData);
          await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
        }
        console.log('[Firestore] 저장 성공');
        onSave();
        onClose();
      } catch (firestoreErr) {
        console.error('[Firestore] 저장 실패:', firestoreErr);
        alert('메뉴 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('[handleSave] 예외 발생:', error);
      alert('메뉴 저장에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalContent}>
        <h3>{product ? '메뉴 수정' : '새 메뉴 추가'}</h3>
        <input type="text" placeholder="메뉴 이름" value={name} onChange={e => setName(e.target.value)} style={styles.input} />
        <input type="number" placeholder="가격" value={price} onChange={e => setPrice(e.target.value)} style={styles.input} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={styles.select}>
          {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
        </select>
        <input type="file" onChange={e => setImageFile(e.target.files[0])} style={{ ...styles.input, border: 'none' }} />
        {imageUrl && !imageFile && <img src={imageUrl} alt="메뉴 이미지" style={styles.imagePreview} />}
        {imageFile && <img src={URL.createObjectURL(imageFile)} alt="새 이미지 미리보기" style={styles.imagePreview} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div>
            {product && (
              <button
                onClick={() => {
                  if (window.confirm("정말로 이 메뉴를 삭제하시겠습니까?")) {
                    onDelete(product);
                    onClose();
                  }
                }}
                style={{ ...styles.button, background: '#ef4444', color: 'white' }}
              >
                삭제
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose}>취소</button>
            <button onClick={handleSave} style={styles.button}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CategoryModal 컴포넌트 ---
function CategoryModal({ isOpen, onClose, category, onSave }) {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(category ? category.name : '');
        }
    }, [category, isOpen]);

    const handleSave = async () => {
        if (!name.trim()) return alert('카테고리 이름을 입력하세요.');
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        try {
            const categoryData = { name, storeId: currentUser.uid };
            if (category) {
                await updateDoc(doc(db, "categories", category.id), categoryData);
            } else {
                await addDoc(collection(db, "categories"), { ...categoryData, createdAt: new Date() });
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
                 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button onClick={onClose}>취소</button>
                    <button onClick={handleSave} style={styles.button}>저장</button>
                </div>
            </div>
        </div>
    );
}

export default function MenuTab({ categories, products, onMenuUpdate }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    } else if (categories.length > 0 && activeCategory) {
      const updatedActiveCategory = categories.find(c => c.id === activeCategory.id);
      setActiveCategory(updatedActiveCategory || categories[0]);
    } else if (categories.length === 0) {
      setActiveCategory(null);
    }
  }, [categories]);

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`'${categoryName}' 카테고리를 삭제하면 속한 메뉴도 모두 삭제됩니다. 계속하시겠습니까?`)) return;
    try {
      const productsToDelete = products.filter(p => p.category === categoryName);
      for (const product of productsToDelete) {
        if (product.imageUrl) {
          try {
            const imageRef = ref(storage, product.imageUrl);
            await deleteObject(imageRef);
          } catch (storageError) {
             console.error("이미지 삭제 실패:", storageError);
          }
        }
        await deleteDoc(doc(db, "products", product.id));
      }
      await deleteDoc(doc(db, "categories", categoryId));
      onMenuUpdate();
    } catch (error) {
      console.error("카테고리 삭제 실패:", error);
      alert("카테고리 삭제에 실패했습니다.");
    }
  };

  const handleDeleteProduct = async (product) => {
     try {
       if (product.imageUrl) {
         const imageRef = ref(storage, product.imageUrl);
         await deleteObject(imageRef);
       }
      await deleteDoc(doc(db, "products", product.id));
      onMenuUpdate();
    } catch (error) {
       console.error("메뉴 삭제 실패:", error);
       alert("메뉴 삭제에 실패했습니다.");
    }
  };

  const filteredMenus = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter(menu => menu.category === activeCategory.name);
  }, [products, activeCategory]);

  const openCategoryModal = (category = null) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };
  
  const openProductModal = (product = null) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  return (
    <div style={styles.container}>
      {/* Categories Sidebar */}
      <aside style={styles.sidebar}>
        <h3>카테고리</h3>
        <ul style={styles.categoryList}>
          <li style={styles.categoryItem(activeCategory === null)} onClick={() => setActiveCategory(null)}>전체 메뉴</li>
          {categories.map(cat => (
            <li 
              key={cat.id} 
              style={{...styles.categoryItem(activeCategory?.id === cat.id), display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
              onClick={() => setActiveCategory(cat)}
            >
              <span>{cat.name}</span>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeCategory?.id === cat.id ? '#fca5a5' : '#ef4444',
                  cursor: 'pointer',
                  padding: '0 0 0 10px',
                  fontSize: '14px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(cat.id, cat.name);
                }}>삭제</button>
            </li>
          ))}
        </ul>
        <button onClick={() => openCategoryModal()} style={styles.button}>+ 새 카테고리</button>
      </aside>

      {/* Menus Main Content */}
      <main style={styles.mainContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>메뉴</h3>
          <button onClick={() => openProductModal()} style={styles.button}>+ 새 메뉴 추가</button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>사진</th><th style={styles.th}>이름</th><th style={styles.th}>가격</th><th style={styles.th}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredMenus.map((menu) => (
              <tr key={menu.id}>
                <td style={styles.td}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '12px' }}>No img</span>
                    )}
                  </div>
                </td>
                <td>{menu.name}</td>
                <td>{Number(menu.price).toLocaleString()}원</td>
                <td>
                  <button style={{marginRight: '8px', cursor: 'pointer'}} onClick={() => openProductModal(menu)}>수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* Modals */}
      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={editingCategory}
        onSave={onMenuUpdate}
      />
      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        categories={categories}
        onSave={onMenuUpdate}
        onDelete={handleDeleteProduct}
      />
    </div>
  );
} 