import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 유틸 함수 추가
function getCurrentStoreName() {
  return localStorage.getItem('storeName') || localStorage.getItem('restaurantName') || '';
}

function toSlug(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, '-');
}

function toLabel(slug) {
  if (!slug) return '';
  return String(slug).replace(/-/g, ' ');
}

function displayName(slug) {
  return String(slug).replace(/-/g, ' ');
}

// 워드프레스 이미지 업로드 함수 추가
async function uploadImageToWordPress(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${import.meta.env.VITE_SITE_URL}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${import.meta.env.VITE_WP_ADMIN_USER}:${import.meta.env.VITE_WP_APP_PASSWORD}`)
    },
    body: formData
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('이미지 업로드 실패: ' + errorText);
  }
  const data = await response.json();
  return data.source_url;
}

export default function MenuTab() {
  const [form, setForm] = useState({ storeName: '' });
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newMenu, setNewMenu] = useState({ name: '', category: '', price: '', image: null });
  const [newCategory, setNewCategory] = useState('');
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [editMenuIdx, setEditMenuIdx] = useState(null);
  const [editMenu, setEditMenu] = useState({ name: '', category: '', price: '', image: null });
  const [editCategoryIdx, setEditCategoryIdx] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editRowIdx, setEditRowIdx] = useState(null);
  const [editRow, setEditRow] = useState({ name: '', price: '', category: '' });

  const wooHeaders = {
    Authorization: 'Basic ' + btoa(`${import.meta.env.VITE_WC_ADMIN_KEY}:${import.meta.env.VITE_WC_ADMIN_SECRET}`),
    'Content-Type': 'application/json'
  };

  // fetchCategoriesFromWoo를 컴포넌트 내부로 이동
  const fetchCategoriesFromWoo = async () => {
    try {
      const wooHeaders = {
        Authorization: 'Basic ' + btoa(`${import.meta.env.VITE_WC_ADMIN_KEY}:${import.meta.env.VITE_WC_ADMIN_SECRET}`),
        'Content-Type': 'application/json'
      };
      const res = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
        { headers: wooHeaders }
      );
      const userCategories = Array.isArray(res.data)
        ? res.data
            .filter(c => typeof c.name === 'string' && decodeURIComponent(c.name).startsWith(`${getCurrentStoreName()}_`))
            .map(c => decodeURIComponent(c.name).replace(`${getCurrentStoreName()}_`, ''))
        : [];
      setCategories(userCategories);
    } catch (err) {
      console.error('❌ 카테고리 불러오기 실패:', err.response?.data || err.message);
    }
  };

  // useEffect 바깥으로 이동
  const fetchMenusFromWoo = async () => {
    try {
      // 1. 내 카테고리 ID 목록 수집
      const catRes = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
        { headers: wooHeaders }
      );
      const storeName = getCurrentStoreName();
      const myCategoryIds = catRes.data
        .filter(c => decodeURIComponent(c.name).startsWith(`${storeName}_`))
        .map(c => c.id);

      // 2. 전체 메뉴 불러오기
      const res = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        { headers: wooHeaders }
      );

      // 3. 내 카테고리 ID가 포함된 메뉴만 필터링
      const filtered = res.data
        .filter(p =>
          Array.isArray(p.categories) &&
          p.categories.some(c => myCategoryIds.includes(c.id))
        )
        .map(p => ({
          name: p.name,
          price: p.regular_price,
          description: p.description,
          image: p.images?.[0]?.src || null,
          category: p.categories?.[0]?.name?.replace(`${storeName}_`, '') || ''
        }));

      setMenus(filtered);
    } catch (err) {
      console.error('❌ WooCommerce 메뉴 불러오기 실패:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    const rawEmail = localStorage.getItem('user_email');
    const email = rawEmail.replace(/[@.]/g, ''); // '@'와 '.' 제거
    if (!email) return;

    fetchMenusFromWoo();

    fetchCategoriesFromWoo();
  }, []);

  useEffect(() => {
    const storedName = getCurrentStoreName();
    if (storedName) {
      setForm((prev) => ({ ...prev, storeName: storedName }));
    }
  }, []);

  const handleMenuSave = async () => {
    if (!newMenu.name || !newMenu.price || !newMenu.category) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    const storeName = getCurrentStoreName();
    try {
      // 1. 카테고리 ID 조회
      const categoryLabel = newMenu.category;
      const categorySlug = toSlug(newMenu.category);
      const categoryName = `${storeName}_${categoryLabel}`;
      const categoryListRes = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories?search=${categoryName}`,
        { headers: wooHeaders }
      );
      const matchedCategory = categoryListRes.data.find(c => {
        if (typeof c.name !== 'string') return false;
        const decoded = decodeURIComponent(c.name);
        return decoded === categoryName;
      });
      if (!matchedCategory) {
        alert('해당 카테고리가 존재하지 않습니다. 카테고리를 먼저 추가해 주세요.');
        return;
      }
      // 2. 동일한 이름의 메뉴가 있는지 확인
      const existingMenusRes = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        { headers: wooHeaders }
      );
      const isDuplicate = existingMenusRes.data.some(m => 
        m.name === newMenu.name && 
        m.categories?.some(c => c.id === matchedCategory.id)
      );
      if (isDuplicate) {
        alert('이미 동일한 이름의 메뉴가 해당 카테고리에 존재합니다.');
        return;
      }
      // 3. 메뉴 저장 (label/slug 분리)
      await axios.post(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        {
          name: newMenu.name, // label(띄어쓰기 포함)
          slug: encodeURIComponent(`${storeName}-${toSlug(newMenu.name)}`), // slug(하이픈)
          regular_price: newMenu.price.toString(),
          description: newMenu.description,
          categories: [{ id: matchedCategory.id }],
          images: newMenu.image ? [{ src: newMenu.image }] : []
        },
        { headers: wooHeaders }
      );
      await fetchMenusFromWoo();
      setNewMenu({ name: '', category: '', price: '', image: null });
      setIsAddingMenu(false);
      alert('메뉴 저장 완료');
    } catch (err) {
      console.error('❌ 메뉴 저장 실패:', err.response?.data || err.message);
      alert('메뉴 저장 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteMenu = async (idx) => {
    const menuToDelete = menus[idx];
    const rawEmail = localStorage.getItem('user_email');
    const email = rawEmail.replace(/[@.]/g, '');
    const emailPrefix = email.replace(/[^a-zA-Z0-9]/g, '');

    try {
      // WooCommerce에서 전체 상품 목록 불러오기
      const res = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        { headers: wooHeaders }
      );

      // slug와 name을 모두 비교하여 해당 상품 찾기
      const matched = res.data.find(m => {
        const slug = m.slug;
        const expectedSlug = encodeURIComponent(`${getCurrentStoreName()}-${toSlug(menuToDelete.name)}`);
        return slug === expectedSlug || m.name === menuToDelete.name;
      });
      if (!matched) {
        console.log('🗑 WooCommerce에서 삭제할 상품을 찾지 못함:', menuToDelete);
      } else if (matched.id) {
        console.log('🗑 삭제 대상 Woo 상품:', matched);
        await axios.delete(
          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/${matched.id}?force=true`,
          { headers: wooHeaders }
        );
      }

      // 웹앱 화면에서도 해당 메뉴 제거
      setMenus(prev => prev.filter((_, i) => i !== idx));

      // 삭제 후 최신 메뉴 목록 재조회
      const refreshRes = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        { headers: wooHeaders }
      );
      // 기존과 동일한 필터 적용
      const filtered = refreshRes.data
        .filter(p => {
          const slugOk = typeof p.slug === 'string' && p.slug.startsWith(encodeURIComponent(`${getCurrentStoreName()}-`));
          const hasCategory = Array.isArray(p.categories) && p.categories.length > 0;
          const categoryOk = hasCategory && p.categories.some(c => {
            if (typeof c.name !== 'string') return false;
            const decoded = decodeURIComponent(c.name);
            return decoded.startsWith(`${getCurrentStoreName()}_`);
          });
          return slugOk && categoryOk;
        })
        .map(p => {
          const categoryObj = Array.isArray(p.categories)
            ? p.categories.find(c => {
                if (typeof c.name !== 'string') return false;
                const decoded = decodeURIComponent(c.name);
                return decoded.startsWith(`${getCurrentStoreName()}_`);
              })
            : null;

          return {
            name: p.name,
            price: p.regular_price,
            description: p.description,
            image: p.images?.[0]?.src || null,
            category: categoryObj ? categoryObj.name.replace(`${getCurrentStoreName()}_`, '') : ''
          };
        });
      setMenus(filtered);
    } catch (err) {
      console.error('메뉴 삭제 실패:', err);
      alert('메뉴 삭제 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCategoryAdd = async () => {
    const storeName = getCurrentStoreName();
    if (!storeName) {
      alert('가게명이 설정되어 있지 않습니다. 가게 정보에서 가게명을 먼저 저장해 주세요.');
      return;
    }
    if (!newCategory || typeof newCategory !== 'string' || newCategory.trim() === '') {
      alert('카테고리명을 입력해 주세요.');
      return;
    }
    const rawCategoryName = newCategory.trim();
    try {
      // 관리자 인증 정보만으로 카테고리 생성
      const categoryName = `${storeName}_${rawCategoryName}`;
      const categorySlug = encodeURIComponent(`${storeName}-${toSlug(rawCategoryName)}`);
      await axios.post(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
        { name: categoryName, slug: categorySlug },
        { headers: wooHeaders }
      );
      // 카테고리 목록 재조회
      await fetchCategoriesFromWoo();
      setNewCategory('');
      alert('카테고리 저장 완료');
    } catch (err) {
      alert('카테고리 저장 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteCategory = async (idx) => {
    // 매장명과 카테고리명을 조합하여 고유 카테고리명/슬러그 생성
    const storeName = getCurrentStoreName();
    const categoryNameToDelete = categories[idx];
    const alreadyCombined = categoryNameToDelete.startsWith(`${storeName}_`);
    const deleteTargetName = alreadyCombined ? categoryNameToDelete : `${storeName}_${categoryNameToDelete}`;
    const deleteTargetSlug = encodeURIComponent(toSlug(deleteTargetName));
    const rawEmail = localStorage.getItem('user_email');
    const email = rawEmail.replace(/[@.]/g, '');
    console.log('🗑 카테고리 삭제 시작:', deleteTargetName, deleteTargetSlug);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
        { headers: wooHeaders }
      );

      // 실제 WooCommerce 카테고리 name/slug 모두 출력
      res.data.forEach(c => {
        console.log('실제 WooCommerce 카테고리:', decodeURIComponent(c.name), decodeURIComponent(c.slug));
      });

      // name 또는 slug가 포함되어 있으면 매칭 (완화)
      const matched = res.data.find(c => {
        const decodedName = decodeURIComponent(c.name);
        const decodedSlug = decodeURIComponent(c.slug);
        return (
          decodedName === deleteTargetName ||
          decodedSlug === deleteTargetSlug ||
          decodedName.includes(categoryNameToDelete) ||
          decodedSlug.includes(encodeURIComponent(toSlug(categoryNameToDelete.replace(/\s+/g, '-').toLowerCase())))
        );
      });
      console.log('🔍 삭제 대상 카테고리:', matched);
      if (!matched) {
        alert('삭제할 카테고리를 찾지 못했습니다. (이름/슬러그 불일치)');
        return;
      }

      // ✅ 1. 해당 카테고리에 연결된 상품 있는지 확인
      const productRes = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        { headers: wooHeaders }
      );
      const hasLinkedProduct = productRes.data.some(p =>
        p.categories?.some(cat => cat.id === matched.id)
      );
      console.log('🔗 해당 카테고리에 연결된 메뉴 존재 여부:', hasLinkedProduct);

      if (hasLinkedProduct) {
        alert('해당 카테고리에 연결된 메뉴가 있어 삭제할 수 없습니다.');
        return;
      }

      // ✅ 2. WooCommerce에서 카테고리 삭제 (force=true 추가)
      console.log('❌ 카테고리 삭제 요청 전 matched ID:', matched.id);
      await axios.delete(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories/${matched.id}?force=true`,
        { headers: wooHeaders }
      );

      // 삭제 후 반드시 목록 새로고침
      await fetchCategoriesFromWoo();
      alert('카테고리 삭제 완료');
    } catch (err) {
      console.error('카테고리 삭제 실패:', err);
      alert('카테고리 삭제 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  // 가게명 동기화 함수 추가
  function syncStoreNameToLocalStorage(name) {
    if (name) {
      localStorage.setItem('storeName', name);
      localStorage.setItem('restaurantName', name);
      localStorage.setItem('storeInfo', JSON.stringify({ storeName: name }));
    }
  }

  // 메뉴 수정 핸들러
  const handleEditMenu = (idx) => {
    setEditMenuIdx(idx);
    setEditMenu(menus[idx]);
  };

  const handleEditMenuSave = async () => {
    try {
      // WooCommerce 상품 ID 찾기
      const res = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        { headers: wooHeaders }
      );
      const storeName = getCurrentStoreName();
      const menuToEdit = menus[editMenuIdx];
      const matched = res.data.find(m => {
        const slug = m.slug;
        const expectedSlug = encodeURIComponent(`${storeName}-${toSlug(menuToEdit.name)}`);
        return slug === expectedSlug || m.name === menuToEdit.name;
      });
      if (!matched) {
        alert('수정할 상품을 찾지 못했습니다.');
        return;
      }
      // 카테고리 ID 찾기
      let categoryId;
      if (editMenu.category) {
        const categoryName = `${storeName}_${editMenu.category}`;
        const categoryListRes = await axios.get(
          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories?search=${categoryName}`,
          { headers: wooHeaders }
        );
        const matchedCategory = categoryListRes.data.find(c => c.name === categoryName);
        if (matchedCategory) categoryId = matchedCategory.id;
      }
      // 상품 수정
      await axios.put(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/${matched.id}`,
        {
          name: editMenu.name,
          regular_price: editMenu.price.toString(),
          description: editMenu.description,
          categories: categoryId ? [{ id: categoryId }] : [],
          images: editMenu.image ? [{ src: editMenu.image }] : []
        },
        { headers: wooHeaders }
      );
      await fetchMenusFromWoo();
      setEditMenuIdx(null);
      alert('메뉴 수정 완료');
    } catch (err) {
      alert('메뉴 수정 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  // 카테고리 수정 핸들러
  const handleEditCategory = (idx) => {
    setEditCategoryIdx(idx);
    setEditCategory(categories[idx]);
  };

  const handleEditCategorySave = async () => {
    try {
      const storeName = getCurrentStoreName();
      const oldName = categories[editCategoryIdx];
      const oldFullName = `${storeName}_${oldName}`;
      const newFullName = `${storeName}_${editCategory}`;
      // WooCommerce 카테고리 ID 찾기
      const res = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
        { headers: wooHeaders }
      );
      const matched = res.data.find(c => decodeURIComponent(c.name) === oldFullName);
      if (!matched) {
        alert('수정할 카테고리를 찾지 못했습니다.');
        return;
      }
      // 카테고리명/슬러그 수정
      await axios.put(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories/${matched.id}`,
        { name: newFullName, slug: encodeURIComponent(`${storeName}-${toSlug(editCategory)}`) },
        { headers: wooHeaders }
      );
      await fetchCategoriesFromWoo();
      setEditCategoryIdx(null);
      alert('카테고리 수정 완료');
    } catch (err) {
      alert('카테고리 수정 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ color: '#222', padding: 20, height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <h3>음식 메뉴 설정</h3>
      <button onClick={() => setIsAddingMenu(true)} style={{ marginBottom: 16 }}>+ 새 메뉴 추가</button>
      {isAddingMenu && (
        <div style={{ border: '1px solid #ddd', padding: 20, borderRadius: 8, marginBottom: 20, background: 'white' }}>
          <h4>새 메뉴 추가</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              value={newMenu.name}
              onChange={(e) => setNewMenu(prev => ({ ...prev, name: e.target.value }))}
              placeholder="메뉴명"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
            />
            <select
              value={newMenu.category}
              onChange={(e) => setNewMenu(prev => ({ ...prev, category: e.target.value }))}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
            >
              <option value="">카테고리 선택</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {displayName(category.replace(`${getCurrentStoreName()}_`, ''))}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newMenu.price}
              onChange={(e) => setNewMenu(prev => ({ ...prev, price: e.target.value }))}
              placeholder="가격"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={async e => {
                const file = e.target.files[0];
                if (file) {
                  const imageUrl = await uploadImageToWordPress(file);
                  setNewMenu(prev => ({ ...prev, image: imageUrl }));
                }
              }}
              style={{ padding: 8 }}
            />
            {newMenu.image && (
              <img src={newMenu.image} alt="메뉴 이미지 미리보기" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover' }} />
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleMenuSave} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4 }}>저장</button>
              <button onClick={() => setIsAddingMenu(false)} style={{ padding: '8px 16px', background: '#f3f4f6', color: '#222', border: 'none', borderRadius: 4 }}>취소</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>카테고리별 보기:</label>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value=''>전체</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>{displayName(cat)}</option>
          ))}
        </select>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: 8, border: '1px solid #ddd' }}></th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>이름</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>가격</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>카테고리</th>
          </tr>
        </thead>
        <tbody>
          {menus.filter(menu => !categoryFilter || menu.category === categoryFilter).map((menu, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8, border: '1px solid #ddd' }}>
                {editRowIdx === idx ? null : (
                  <button onClick={() => {
                    setEditRowIdx(idx);
                    setEditRow({ name: menu.name, price: menu.price, category: menu.category });
                  }} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ddd', background: '#f3f4f6', cursor: 'pointer' }}>수정</button>
                )}
              </td>
              {editRowIdx === idx ? (
                <>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <input value={editRow.name} onChange={e => setEditRow(r => ({ ...r, name: e.target.value }))} style={{ width: '100%' }} />
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <input type="number" value={editRow.price} onChange={e => setEditRow(r => ({ ...r, price: e.target.value }))} style={{ width: '100%' }} />
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <select value={editRow.category} onChange={e => setEditRow(r => ({ ...r, category: e.target.value }))} style={{ width: '100%' }}>
                      {categories.map((cat, i) => (
                        <option key={i} value={cat}>{displayName(cat)}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <button onClick={async () => {
                      // 저장 로직
                      const updated = { ...menus[idx], ...editRow };
                      // WooCommerce 상품 ID 찾기
                      const res = await axios.get(
                        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
                        { headers: wooHeaders }
                      );
                      const storeName = getCurrentStoreName();
                      const matched = res.data.find(m => {
                        const slug = m.slug;
                        const expectedSlug = encodeURIComponent(`${storeName}-${toSlug(menus[idx].name)}`);
                        return slug === expectedSlug || m.name === menus[idx].name;
                      });
                      if (!matched) {
                        alert('수정할 상품을 찾지 못했습니다.');
                        return;
                      }
                      // 카테고리 ID 찾기
                      let categoryId;
                      if (editRow.category) {
                        const categoryName = `${storeName}_${editRow.category}`;
                        const categoryListRes = await axios.get(
                          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories?search=${categoryName}`,
                          { headers: wooHeaders }
                        );
                        const matchedCategory = categoryListRes.data.find(c => c.name === categoryName);
                        if (matchedCategory) categoryId = matchedCategory.id;
                      }
                      // 상품 수정
                      await axios.put(
                        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/${matched.id}`,
                        {
                          name: editRow.name,
                          regular_price: editRow.price.toString(),
                          categories: categoryId ? [{ id: categoryId }] : [],
                        },
                        { headers: wooHeaders }
                      );
                      await fetchMenusFromWoo();
                      setEditRowIdx(null);
                      alert('메뉴 수정 완료');
                    }} style={{ marginRight: 4, padding: '4px 10px', borderRadius: 4, border: '1px solid #3b82f6', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}>저장</button>
                    <button onClick={() => setEditRowIdx(null)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ddd', background: '#f3f4f6', cursor: 'pointer' }}>취소</button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{displayName(menu.name)}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{menu.price}원</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{displayName(menu.category)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <h4>카테고리 관리</h4>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="새 카테고리 입력"
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
        />
        <button onClick={handleCategoryAdd} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4 }}>카테고리 추가</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
        {[...new Set(categories)].map((category, index) => (
          <div key={category + index} style={{ padding: '8px 16px', background: '#f3f4f6', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            {editCategoryIdx === index ? (
              <>
                <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} />
                <button onClick={handleEditCategorySave}>저장</button>
                <button onClick={() => setEditCategoryIdx(null)}>취소</button>
              </>
            ) : (
              <>
                {displayName(category.replace(`${getCurrentStoreName()}_`, ''))}
                <button onClick={() => handleEditCategory(index)} style={{ marginLeft: 4 }}>수정</button>
                <button onClick={() => deleteCategory(categories.indexOf(category))} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>×</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 