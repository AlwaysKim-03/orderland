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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Utensils, 
  AlertTriangle, 
  Crown,
  Edit,
  Trash2
} from "lucide-react";

// --- 스타일 컴포넌트 ---
const styles = {
  container: { padding: '20px', fontFamily: 'sans-serif', background: '#f8fafc' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  button: {
    padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
  },
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
                <h3>{category ? '카테고리 수정' : '새 카테고리 추가'}</h3>
                <input 
                    type="text" 
                    placeholder="카테고리 이름" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={styles.input} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <button onClick={onClose}>취소</button>
                    <button onClick={handleSave} style={styles.button}>저장</button>
                </div>
            </div>
        </div>
    );
}

export default function MenuTab({ categories, products, onMenuUpdate }) {
  const [selectedCategory, setSelectedCategory] = useState('전체 메뉴');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState(null);

  // 카테고리별 메뉴 필터링
  const filteredProducts = useMemo(() => {
    if (selectedCategory === '전체 메뉴') {
      return products;
    }
    return products.filter(product => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까? 이 카테고리의 모든 메뉴도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      // 해당 카테고리의 모든 메뉴 삭제
      const productsToDelete = products.filter(product => product.category === categoryName);
      for (const product of productsToDelete) {
        await deleteDoc(doc(db, "products", product.id));
      }

      // 카테고리 삭제
      await deleteDoc(doc(db, "categories", categoryId));
      
      alert('카테고리가 성공적으로 삭제되었습니다.');
      if (onMenuUpdate) onMenuUpdate();
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`"${product.name}" 메뉴를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "products", product.id));
      alert('메뉴가 성공적으로 삭제되었습니다.');
      if (onMenuUpdate) onMenuUpdate();
    } catch (error) {
      console.error('메뉴 삭제 실패:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  };

  const openCategoryModal = (category = null) => {
    setSelectedCategoryForEdit(category);
    setIsCategoryModalOpen(true);
  };

  const openProductModal = (product = null) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  // 모든 카테고리 목록 (전체 메뉴 포함)
  const allCategories = ['전체 메뉴', ...categories.map(cat => cat.name)];

  // 빈 상태 렌더링
  if (categories.length === 0 && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mb-8">
          <Utensils className="w-16 h-16 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-4">메뉴를 추가해주세요</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          고객들이 주문할 수 있는 메뉴와 카테고리를 추가하여 매장을 준비하세요.
        </p>
        <div className="flex gap-6">
          <Button size="lg" className="h-16 px-8 text-lg" onClick={() => openCategoryModal()}>
            <Plus className="w-6 h-6 mr-3" />
            카테고리 추가
          </Button>
          <Button size="lg" className="h-16 px-8 text-lg" onClick={() => openProductModal()}>
            <Plus className="w-6 h-6 mr-3" />
            메뉴 추가
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">메뉴 관리</h2>
        <p className="text-muted-foreground">
        메뉴와 카테고리를 관리하세요
      </p>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {allCategories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat)}
            className="whitespace-nowrap"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => openCategoryModal()}>
          <Plus className="w-4 h-4 mr-2" />
          카테고리 추가
        </Button>
        <Button onClick={() => openProductModal()}>
          <Plus className="w-4 h-4 mr-2" />
          메뉴 추가
        </Button>
      </div>

      {/* 메뉴 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className="hover:shadow-lg transition-all duration-200 relative overflow-hidden group">
            {/* 상태 배지 */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              {product.outOfStock && (
                <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  품절
                </Badge>
              )}
              {product.ingredientsDepleted && (
                <Badge variant="warning" className="flex items-center gap-1 text-xs">
                  📦
                  재료 소진
                </Badge>
              )}
            </div>

            {/* 추천 배지 */}
            {product.recommended && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Crown className="w-3 h-3" />
                {product.recommended === 'boss' ? '사장님 추천' : 
                 product.recommended === 'best' ? '베스트 메뉴' : '신메뉴'}
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4 pt-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                  ) : (
                    <Utensils className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-2xl font-bold text-primary">
                ₩{product.price.toLocaleString()}
              </div>
              
              {product.description && (
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              )}
              
              {/* 토글 컨트롤 */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">품절</span>
                  <Switch 
                    checked={product.outOfStock || false}
                    onCheckedChange={(checked) => {
                      // 상태 변경 로직
                      console.log('품절 상태 변경:', checked);
                    }}
                  />
              </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">재료 소진</span>
                  <Switch 
                    checked={product.ingredientsDepleted || false}
                    onCheckedChange={(checked) => {
                      console.log('재료 소진 상태 변경:', checked);
                    }}
                  />
              </div>
            </div>

            {/* 액션 버튼 */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => openProductModal(product)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  수정
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteProduct(product)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 모달들 */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        categories={categories}
        onSave={onMenuUpdate}
        onDelete={handleDeleteProduct}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategoryForEdit}
        onSave={onMenuUpdate}
      />
    </div>
  );
} 