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

export default function MenuTab() {
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null means 'All'
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null); // null for new, object for edit

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- Data Fetching ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const catQuery = query(collection(db, "categories"), where("storeId", "==", currentUser.uid), orderBy("createdAt", "asc"));
      const menuQuery = query(collection(db, "products"), where("storeId", "==", currentUser.uid), orderBy("createdAt", "asc"));
      
      const [catSnapshot, menuSnapshot] = await Promise.all([getDocs(catQuery), getDocs(menuQuery)]);
      
      const fetchedCategories = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const fetchedMenus = menuSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setCategories(fetchedCategories);
      setMenus(fetchedMenus);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('데이터 로딩에 실패했습니다. Firebase 색인을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Event Handlers ---
  const openNewMenuModal = () => {
    setEditingMenu(null);
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (menu) => {
    setEditingMenu(menu);
    setIsMenuModalOpen(true);
  };
  
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return alert('카테고리 이름을 입력하세요.');
    try {
        await addDoc(collection(db, "categories"), {
            name: newCategoryName,
            storeId: currentUser.uid,
            createdAt: new Date()
        });
        setNewCategoryName('');
        setIsCategoryModalOpen(false);
        fetchData();
    } catch(err) {
        alert('카테고리 추가 실패');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    // Check if any menu is using this category
    const isCategoryInUse = menus.some(menu => menu.category === categoryToDelete.name);
    
    if (isCategoryInUse) {
        alert(`'${categoryToDelete.name}' 카테고리를 사용하는 메뉴가 있습니다. 메뉴의 카테고리를 먼저 변경하거나 삭제해주세요.`);
        return;
    }

    if (window.confirm(`'${categoryToDelete.name}' 카테고리를 정말로 삭제하시겠습니까?`)) {
        try {
            await deleteDoc(doc(db, "categories", categoryId));
            setSelectedCategory(null); // Go back to 'All'
            fetchData(); // Refresh data
        } catch (err) {
            console.error("카테고리 삭제 실패:", err);
            alert("카테고리 삭제에 실패했습니다.");
        }
    }
  };

  // --- Filtered Menus ---
  const filteredMenus = useMemo(() => {
    if (!selectedCategory) return menus;
    return menus.filter(menu => menu.category === selectedCategory.name);
  }, [menus, selectedCategory]);

  if (loading) return <div>메뉴 정보를 불러오는 중...</div>;

  return (
    <div style={styles.container}>
      {/* Left Sidebar: Categories */}
      <aside style={styles.sidebar}>
        <h3 style={{ marginTop: 0 }}>카테고리</h3>
        <ul style={styles.categoryList}>
          <li style={styles.categoryItem(selectedCategory === null)} onClick={() => setSelectedCategory(null)}>전체 메뉴</li>
          {categories.map(cat => (
            <li key={cat.id} style={{...styles.categoryItem(selectedCategory?.id === cat.id), display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} onClick={() => setSelectedCategory(cat)}>
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
        <button style={{...styles.button, background: '#10b981'}} onClick={() => setIsCategoryModalOpen(true)}>+ 새 카테고리</button>
      </aside>

      {/* Main Content: Menus */}
      <main style={styles.mainContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ marginTop: 0 }}>
            {selectedCategory ? `${selectedCategory.name} 메뉴` : '전체 메뉴'} ({filteredMenus.length})
          </h3>
          <button style={styles.button} onClick={openNewMenuModal}>+ 새 메뉴 추가</button>
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
                  <button onClick={() => openEditMenuModal(menu)} style={{marginRight: '8px'}}>수정</button>
                  <button onClick={async () => {
                      if (!window.confirm("정말로 메뉴를 삭제하시겠습니까?")) return;
                      await deleteDoc(doc(db, "products", menu.id));
                      fetchData();
                  }}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* Menu Add/Edit Modal */}
      {isMenuModalOpen && (
        <MenuModal 
          isOpen={isMenuModalOpen}
          onClose={() => setIsMenuModalOpen(false)}
          menu={editingMenu}
          categories={categories}
          onSave={fetchData}
          storeId={currentUser.uid}
        />
      )}

      {/* Category Add Modal */}
      {isCategoryModalOpen && (
          <div style={styles.modalBackdrop}>
              <div style={styles.modalContent}>
                  <h3 style={{marginTop: 0}}>새 카테고리 추가</h3>
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="카테고리 이름"
                    style={styles.input}
                  />
                  <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                      <button onClick={() => setIsCategoryModalOpen(false)}>취소</button>
                      <button onClick={handleSaveCategory} style={styles.button}>저장</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

// --- Sub-component: MenuModal ---
function MenuModal({ isOpen, onClose, menu, categories, onSave, storeId }) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (menu) {
            setName(menu.name);
            setPrice(menu.price);
            setCategory(menu.category);
            setImageUrl(menu.imageUrl || '');
        } else {
            setName('');
            setPrice('');
            setCategory(categories.length > 0 ? categories[0].name : '');
            setImageUrl('');
        }
        setImageFile(null); // Reset file input on open
    }, [menu, isOpen, categories]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            // Create a preview URL
            const previewUrl = URL.createObjectURL(file);
            setImageUrl(previewUrl);
        }
    };

    const handleSave = async () => {
        if (!name || !price || !category) return alert('모든 필드를 입력하세요.');
        setIsUploading(true);

        try {
            let finalImageUrl = menu?.imageUrl || '';

            if (imageFile) {
                const imageRef = ref(storage, `menu_images/${storeId}/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(imageRef, imageFile);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            }
            
            const menuData = {
                name,
                price: Number(price),
                category,
                storeId,
                imageUrl: finalImageUrl,
                createdAt: menu?.createdAt || new Date()
            };

            if (menu) { // Edit mode
                await updateDoc(doc(db, "products", menu.id), menuData);
            } else { // Create mode
                await addDoc(collection(db, "products"), menuData);
            }
            onSave();
            onClose();
        } catch(err) {
            alert('메뉴 저장에 실패했습니다.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContent}>
                <h3 style={{marginTop: 0}}>{menu ? '메뉴 수정' : '새 메뉴 추가'}</h3>
                {imageUrl && <img src={imageUrl} alt="메뉴 미리보기" style={styles.imagePreview} />}
                <label>메뉴 사진</label>
                <input style={{...styles.input, padding: '10px 0 0 0', border: 'none'}} type="file" accept="image/*" onChange={handleFileChange} />
                <label>메뉴 이름</label>
                <input style={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="메뉴 이름" />
                <label>가격</label>
                <input style={styles.input} type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="가격" />
                <label>카테고리</label>
                <select style={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                    <button onClick={onClose} disabled={isUploading}>취소</button>
                    <button style={styles.button} onClick={handleSave} disabled={isUploading}>
                        {isUploading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
} 