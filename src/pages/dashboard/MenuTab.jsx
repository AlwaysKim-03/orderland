import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MenuTab() {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newMenu, setNewMenu] = useState({ name: '', category: '', price: '', image: null, description: '' });
  const [newCategory, setNewCategory] = useState('');
  const [isAddingMenu, setIsAddingMenu] = useState(false);

  const wooHeaders = {
    Authorization: 'Basic ' + btoa(`${import.meta.env.VITE_WC_KEY}:${import.meta.env.VITE_WC_SECRET}`),
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    const rawEmail = localStorage.getItem('user_email');
    const email = rawEmail.replace(/[@.]/g, ''); // '@'와 '.' 제거
    if (!email) return;

    const fetchMenusFromWoo = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
          { headers: wooHeaders }
        );

        const filtered = res.data
          .filter(p => {
            const slugOk = typeof p.slug === 'string' && p.slug.startsWith(`${email}-`);
            const hasCategory = Array.isArray(p.categories) && p.categories.length > 0;

            const categoryOk = hasCategory && p.categories.some(c => {
              if (typeof c.name !== 'string') return false;
              const decodedName = decodeURIComponent(c.name);
              return decodedName.startsWith(`${email}_`);
            });

            return slugOk && categoryOk;
          })
          .map(p => {
            const categoryObj = Array.isArray(p.categories)
              ? p.categories.find(c => {
                  if (typeof c.name !== 'string') return false;
                  const decodedName = decodeURIComponent(c.name);
                  return decodedName.startsWith(`${email}_`);
                })
              : null;

            return {
              name: p.name,
              price: p.regular_price,
              description: p.description,
              image: p.images?.[0]?.src || null,
              category: categoryObj ? categoryObj.name.replace(`${email}_`, '') : ''
            };
          });

        setMenus(filtered);
      } catch (err) {
        console.error('❌ WooCommerce 메뉴 불러오기 실패:', err.response?.data || err.message);
      }
    };

    const fetchCategoriesFromWoo = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
          { headers: wooHeaders }
        );

        const userCategories = Array.isArray(res.data)
          ? res.data
              .filter(c => typeof c.name === 'string' && decodeURIComponent(c.name).startsWith(`${email}_`))
              .map(c => decodeURIComponent(c.name).replace(`${email}_`, ''))
          : [];

        setCategories(userCategories);
      } catch (err) {
        console.error('❌ 카테고리 불러오기 실패:', err.response?.data || err.message);
      }
    };

    fetchMenusFromWoo();
    fetchCategoriesFromWoo();
  }, []);

  const saveToWooCommerce = async (menu) => {
    const email = localStorage.getItem('user_email');
    try {
      // 1. 카테고리가 없으면 먼저 생성
      let categoryId;
      if (menu.category) {
        const categoryName = `${email}_${menu.category}`;
        // 1. WooCommerce에서 카테고리 존재 여부 먼저 확인
        const categoryListRes = await axios.get(
          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories?search=${categoryName}`,
          { headers: wooHeaders }
        );
        const matchedCategory = categoryListRes.data.find(c => c.name === categoryName);

        if (matchedCategory) {
          categoryId = matchedCategory.id;
        } else {
          // 없으면 새로 생성
          const categoryRes = await axios.post(
            `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
            { name: categoryName },
            { headers: wooHeaders }
          );
          categoryId = categoryRes.data.id;
        }
      }

      // 2. 상품 생성
      await axios.post(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        {
          name: menu.name,
          regular_price: menu.price.toString(),
          description: menu.description,
          categories: categoryId ? [{ id: categoryId }] : [],
          images: menu.image ? [{ src: menu.image }] : []
        },
        { headers: wooHeaders }
      );

    } catch (err) {
      console.error('❌ 메뉴 저장 실패:', err.response?.data || err.message);
      throw err;
    }
  };

  const handleMenuSave = async () => {
    if (!newMenu.name || !newMenu.price || !newMenu.category) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    const rawEmail = localStorage.getItem('user_email');
    const email = rawEmail.replace(/[@.]/g, ''); // '@'와 '.' 제거
    let categoryId;

    try {
      console.log('🧪 저장 시작: ', newMenu);
      // 1. 카테고리 ID 조회 또는 생성
      const categoryName = `${email}_${newMenu.category}`;
      const categoryListRes = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories?search=${categoryName}`,
        { headers: wooHeaders }
      );
      const matchedCategory = categoryListRes.data.find(c => {
        if (typeof c.name !== 'string') return false;
        const decoded = decodeURIComponent(c.name);
        return decoded.startsWith(`${email}_`);
      });
      console.log('🧩 조회된 카테고리:', matchedCategory);

      if (matchedCategory) {
        categoryId = matchedCategory.id;
      } else {
        const categoryRes = await axios.post(
          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
          { name: categoryName },
          { headers: wooHeaders }
        );
        categoryId = categoryRes.data.id;
        console.log('📁 새 카테고리 생성:', categoryRes.data);
      }

      // 2. WooCommerce에 메뉴 저장
      console.log('📝 메뉴 저장 요청:', {
        name: newMenu.name,
        slug: `${email}-${newMenu.name.toLowerCase().replace(/\s+/g, '-')}`,
        categoryId
      });
      const savedRes = await axios.post(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        {
          name: newMenu.name,
          slug: `${email}-${newMenu.name.toLowerCase().replace(/\s+/g, '-')}`,
          regular_price: newMenu.price.toString(),
          description: newMenu.description,
          categories: categoryId ? [{ id: categoryId }] : [],
          images: newMenu.image ? [{ src: newMenu.image }] : []
        },
        { headers: wooHeaders }
      );
      console.log('📤 저장 응답:', savedRes.data);

      // 3. 메뉴 목록 재조회
      const res = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products`,
        { headers: wooHeaders }
      );

      const filtered = res.data
        .filter(p => {
          const slugOk = typeof p.slug === 'string' && p.slug.startsWith(`${email}-`);
          const hasCategory = Array.isArray(p.categories) && p.categories.length > 0;
          const categoryOk = hasCategory && p.categories.some(c => {
            if (typeof c.name !== 'string') return false;
            const decoded = decodeURIComponent(c.name);
            return decoded.startsWith(`${email}_`);
          });
          return slugOk && categoryOk;
        })
        .map(p => {
          const categoryObj = Array.isArray(p.categories)
            ? p.categories.find(c => {
                if (typeof c.name !== 'string') return false;
                const decoded = decodeURIComponent(c.name);
                return decoded.startsWith(`${email}_`);
              })
            : null;

          return {
            name: p.name,
            price: p.regular_price,
            description: p.description,
            image: p.images?.[0]?.src || null,
            category: categoryObj ? categoryObj.name.replace(`${email}_`, '') : ''
          };
        });

      setMenus(filtered);
      setNewMenu({ name: '', category: '', price: '', image: null, description: '' });
      setIsAddingMenu(false);
      alert('메뉴 저장 완료');
    } catch (err) {
      console.error('❌ 메뉴 저장 실패:', err.response?.data || err.message);
      alert('메뉴 저장 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMenu(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
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
        const expectedSlug = `${email}-${menuToDelete.name.toLowerCase().replace(/\s+/g, '-')}`;
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
          const slugOk = typeof p.slug === 'string' && p.slug.startsWith(`${email}-`);
          const hasCategory = Array.isArray(p.categories) && p.categories.length > 0;
          const categoryOk = hasCategory && p.categories.some(c => {
            if (typeof c.name !== 'string') return false;
            const decoded = decodeURIComponent(c.name);
            return decoded.startsWith(`${email}_`);
          });
          return slugOk && categoryOk;
        })
        .map(p => {
          const categoryObj = Array.isArray(p.categories)
            ? p.categories.find(c => {
                if (typeof c.name !== 'string') return false;
                const decoded = decodeURIComponent(c.name);
                return decoded.startsWith(`${email}_`);
              })
            : null;

          return {
            name: p.name,
            price: p.regular_price,
            description: p.description,
            image: p.images?.[0]?.src || null,
            category: categoryObj ? categoryObj.name.replace(`${email}_`, '') : ''
          };
        });
      setMenus(filtered);
    } catch (err) {
      console.error('메뉴 삭제 실패:', err);
      alert('메뉴 삭제 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCategoryAdd = async () => {
    const rawEmail = localStorage.getItem('user_email');
    const email = rawEmail.replace(/[@.]/g, '');
    console.log('🧪 카테고리 추가 시작:', newCategory);
    try {
      // 프록시 서버를 통해 카테고리 생성
      console.log('📤 프록시로 카테고리 생성 요청:', { name: newCategory, email });
      const response = await axios.post('http://localhost:5001/api/create-category', {
        name: newCategory,
        email
      });
      console.log('✅ 프록시 카테고리 생성 완료:', response.data);

      // 웹앱(프록시 서버)에 전체 배열 저장
      const updatedCategories = [...categories, newCategory];
      console.log('📦 프록시에 저장할 전체 메뉴:', menus);
      console.log('📦 프록시에 저장할 전체 카테고리:', updatedCategories);
      await axios.post('http://localhost:5001/api/save-menu', {
        email,
        menus,
        categories: updatedCategories
      });
      setNewCategory('');
      setCategories(prev => [...prev, newCategory]);
      alert('카테고리 저장 완료');
    } catch (err) {
      alert('카테고리 저장 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteCategory = async (idx) => {
    const rawEmail = localStorage.getItem('user_email');
    const email = rawEmail.replace(/[@.]/g, '');
    const categoryToDelete = `${email}_${categories[idx]}`;
    console.log('🗑 카테고리 삭제 시작:', categoryToDelete);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
        { headers: wooHeaders }
      );

      const matched = res.data.find(c => c.name === categoryToDelete);
      console.log('🔍 삭제 대상 카테고리:', matched);
      if (!matched) return;

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

      setCategories(prev => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error('카테고리 삭제 실패:', err);
      alert('카테고리 삭제 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ color: '#222', padding: 20 }}>
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
                  {category.replace(`${localStorage.getItem('user_email')}_`, '')}
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
            <textarea
              value={newMenu.description}
              onChange={(e) => setNewMenu(prev => ({ ...prev, description: e.target.value }))}
              placeholder="메뉴 설명 (선택사항)"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd', minHeight: 100 }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
        {menus.map((menu, idx) => {
          return (
            <div key={idx} style={{ border: '1px solid #000', borderRadius: 8, overflow: 'hidden', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {menu.image && (
                <img src={menu.image} alt={menu.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
              )}
              <div style={{ padding: 15 }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{menu.name}</h4>
                <p style={{ color: '#666', margin: '0 0 10px 0' }}>{menu.category}</p>
                <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>{menu.price}원</p>
                {menu.description && (
                  <p style={{ color: '#666', fontSize: 14 }}>{menu.description}</p>
                )}
                <button onClick={() => deleteMenu(idx)} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, width: '100%' }}>삭제</button>
              </div>
            </div>
          );
        })}
      </div>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {categories.map((category, index) => (
          <div key={index} style={{ padding: '8px 16px', background: '#f3f4f6', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            {category.replace(`${localStorage.getItem('user_email')}_`, '')}
            <button onClick={() => deleteCategory(index)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
} 