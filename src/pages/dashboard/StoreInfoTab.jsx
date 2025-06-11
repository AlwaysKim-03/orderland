import React, { useEffect, useState, useMemo } from 'react';
import { FaCog } from 'react-icons/fa';
import axios from 'axios';
import { toSlug } from '../../utils/slug';
import QRCodeGenerator from '../../components/QRCodeGenerator';

function decodeUnicodeHex(str) {
  return str.replace(/u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}
function safeDecode(name) {
  try {
    if (/^(u[0-9a-fA-F]{4})+$/.test(name)) return decodeUnicodeHex(name);
    if (/^%[0-9A-Fa-f]{2}/.test(name)) return decodeURIComponent(name);
    return name;
  } catch {
    return name;
  }
}

function displayName(slug) {
  return String(slug).replace(/-/g, ' ');
}

export default function StoreInfoTab({ tableCount, setTableCount, orders = [], fetchOrders, restaurantName, setRestaurantName }) {
  const [userInfo, setUserInfo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const email = localStorage.getItem('user_email');
    console.log("📌 사용자 이메일:", email);
    if (email) {
      axios.get(`http://localhost:5001/api/user-info?email=${email}`)
        .then(res => {
          const meta = res.data.meta || {};
          // userInfo 응답 데이터 확인
          console.log("📌 userInfo 응답 데이터:", res.data);
          // menus, categories가 문자열이면 JSON.parse로 복원
          const parsedMenus = typeof meta.menus === 'string' ? JSON.parse(meta.menus) : (meta.menus || []);
          const parsedCategories = typeof meta.categories === 'string' ? JSON.parse(meta.categories) : (meta.categories || []);

          // userInfo를 한 번에 설정
          setUserInfo({
            ...res.data,
            meta: {
              ...meta,
              menus: parsedMenus,
              categories: parsedCategories
            }
          });

          setForm({
            restaurantName: Array.isArray(meta.restaurantName)
              ? meta.restaurantName[0] || res.data.display_name || res.data.name || ''
              : (meta.restaurantName || res.data.display_name || res.data.name || ''),
            phone: Array.isArray(meta.phone) ? meta.phone[0] || '' : (meta.phone || ''),
            description: Array.isArray(meta.description) ? meta.description[0] || '' : (meta.description || ''),
            tableCount: Number(meta.tableCount) || 1,
            menus: parsedMenus,
            categories: parsedCategories,
          });
          // form 상태 확인
          console.log("📌 form 상태 최신:", form);
        })
        .catch(err => {
          console.error('사용자 정보 불러오기 실패:', err);
        });
    }
  }, []);

  useEffect(() => {
    console.log('form 상태 최신:', form);
  }, [form]);

  useEffect(() => {
    // userInfo가 변경될 때마다 가게명(restaurantName)을 localStorage와 상태에 동기화
    if (userInfo?.meta?.restaurantName) {
      localStorage.setItem('restaurantName', userInfo.meta.restaurantName);
      localStorage.setItem('storeName', userInfo.meta.restaurantName);
      localStorage.setItem('storeInfo', JSON.stringify({ storeName: userInfo.meta.restaurantName }));
      setRestaurantName && setRestaurantName(userInfo.meta.restaurantName);
    }
  }, [userInfo, setRestaurantName]);

  const handleUpdate = async () => {
    const email = localStorage.getItem('user_email');
    const prevStoreName = userInfo?.meta?.restaurantName || userInfo?.display_name || userInfo?.name || '';
    const newStoreName = Array.isArray(form.restaurantName) ? form.restaurantName[0] || '' : (form.restaurantName || '');
    const updateData = {
      email,
      meta: {
        phone: Array.isArray(form.phone) ? form.phone[0] || '' : (form.phone || ''),
        restaurantName: newStoreName,
        description: Array.isArray(form.description) ? form.description[0] || '' : (form.description || ''),
        tableCount: Number(form.tableCount) || 1,
        menus: JSON.stringify(Array.isArray(form.menus) ? form.menus.map(m => ({ name: m.name, price: m.price })) : []),
        categories: JSON.stringify(Array.isArray(form.categories) ? form.categories : [])
      }
    };
    console.log('저장할 데이터:', updateData);

    try {
      // 1. 사용자 정보 업데이트
      await axios.post('http://localhost:5001/api/update-user-info', updateData);

      // 2. 워드프레스 카테고리/메뉴 일괄 동기화 (가게명 변경 시)
      if (prevStoreName && newStoreName && prevStoreName !== newStoreName) {
        const wooHeaders = {
          Authorization: 'Basic ' + btoa(`${import.meta.env.VITE_WC_ADMIN_KEY}:${import.meta.env.VITE_WC_ADMIN_SECRET}`),
          'Content-Type': 'application/json'
        };
        // 2-1. 모든 카테고리 조회
        const catRes = await axios.get(
          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories`,
          { headers: wooHeaders }
        );
        // 2-2. 이전 가게명으로 시작하는 카테고리만 필터링
        const prevPrefix = `${prevStoreName}_`;
        const newPrefix = `${newStoreName}_`;
        const prevSlugPrefix = `${prevStoreName}-`;
        const newSlugPrefix = `${newStoreName}-`;
        const categoriesToUpdate = catRes.data.filter(c => decodeURIComponent(c.name).startsWith(prevPrefix));
        // 2-3. 카테고리명/슬러그 일괄 수정
        for (const cat of categoriesToUpdate) {
          const oldName = decodeURIComponent(cat.name);
          const oldSlug = decodeURIComponent(cat.slug);
          const categoryName = oldName.replace(prevPrefix, newPrefix);
          const categorySlug = oldSlug.replace(prevSlugPrefix, newSlugPrefix);
          await axios.put(
            `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/categories/${cat.id}`,
            { name: categoryName, slug: categorySlug },
            { headers: wooHeaders }
          );
        }
        // 2-4. 모든 상품(메뉴) 조회
        const prodRes = await axios.get(
          `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products?per_page=100`,
          { headers: wooHeaders }
        );
        // 2-5. 각 상품의 카테고리 연결도 새 카테고리로 재연결
        for (const product of prodRes.data) {
          if (!Array.isArray(product.categories) || product.categories.length === 0) continue;
          // 이전 가게명 카테고리 연결된 상품만
          const prevCat = product.categories.find(c => decodeURIComponent(c.name).startsWith(prevPrefix));
          if (!prevCat) continue;
          // 새 카테고리 찾기
          const newCatName = prevCat.name.replace(prevPrefix, newPrefix);
          const newCat = catRes.data.find(c => decodeURIComponent(c.name) === newCatName);
          if (!newCat) continue;
          // 상품의 카테고리 연결을 새 카테고리로 변경
          await axios.put(
            `${import.meta.env.VITE_SITE_URL}/wp-json/wc/v3/products/${product.id}`,
            { categories: [{ id: newCat.id }] },
            { headers: wooHeaders }
          );
        }
      }

      // 3. 사용자 정보 재조회 및 상태 반영
      const res = await axios.get(`http://localhost:5001/api/user-info?email=${email}`);
      const meta = res.data.meta || {};
      const parsedMenus = typeof meta.menus === 'string' ? JSON.parse(meta.menus) : (meta.menus || []);
      const parsedCategories = typeof meta.categories === 'string' ? JSON.parse(meta.categories) : (meta.categories || []);
      setUserInfo({
        ...res.data,
        meta: {
          ...meta,
          menus: parsedMenus,
          categories: parsedCategories
        }
      });
      setForm({
        restaurantName: Array.isArray(meta.restaurantName)
          ? meta.restaurantName[0] || res.data.display_name || res.data.name || ''
          : (meta.restaurantName || res.data.display_name || res.data.name || ''),
        phone: Array.isArray(meta.phone) ? meta.phone[0] || '' : (meta.phone || ''),
        description: Array.isArray(meta.description) ? meta.description[0] || '' : (meta.description || ''),
        tableCount: Number(meta.tableCount) || 1,
        menus: parsedMenus,
        categories: parsedCategories,
      });
      // 가게명(restaurantName)을 localStorage에 동기화
      if (meta.restaurantName) {
        localStorage.setItem('restaurantName', meta.restaurantName);
        localStorage.setItem('storeName', meta.restaurantName);
        localStorage.setItem('storeInfo', JSON.stringify({ storeName: meta.restaurantName }));
        setRestaurantName && setRestaurantName(meta.restaurantName);
      }
      alert('수정 완료');
      setEditing(false);
      if (setTableCount) setTableCount(form.tableCount);
    } catch (err) {
      console.error('저장 실패:', err);
      alert('수정 실패: ' + err.message);
    }
  };

  // 테이블별 URL 동적 생성
  const storeSlug = useMemo(() => {
    let restaurantName = form?.restaurantName || '';
    if (Array.isArray(restaurantName)) restaurantName = restaurantName[0] || '';
    if (typeof restaurantName !== 'string') restaurantName = String(restaurantName || '');
    if (!restaurantName) return '';
    // 띄어쓰기는 하이픈, 특수문자는 그대로 두고 URL에선 인코딩
    return encodeURIComponent(toSlug(restaurantName));
  }, [form?.restaurantName]);

  const tableUrls = useMemo(() => {
    if (!storeSlug || !form.tableCount) return [];
    return Array.from({ length: form.tableCount }, (_, i) =>
      `${window.location.origin}/order/${storeSlug}/table-${i + 1}`
    );
  }, [storeSlug, form.tableCount]);

  console.log("📌 슬러그 생성용 이름:", storeSlug);
  console.log("📌 테이블 URL:", tableUrls);

  // 오늘 매출 연동
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysOrders = (orders || []).filter(order => {
    const ts = order.timestamp || order.date || order.created_at;
    if (!ts) return false;
    return ts.slice(0, 10) === todayStr;
  });
  const todaySales = todaysOrders.reduce((sum, order) => {
    let items = order.items || order.orders;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items)) return sum;
    return sum + items.reduce((s, item) => s + (Number(item.price) * Number(item.quantity || 1)), 0);
  }, 0);
  const todayOrderCount = todaysOrders.length;

  return (
    <div style={{ border: '1px solid #ccc', padding: 20, color: '#222', width: '100vw', minHeight: '100vh', margin: 0, boxSizing: 'border-box', background: '#fff' }}>
      <h3>
        가게 정보 <button onClick={() => setEditing(!editing)}><FaCog /> 수정</button>
      </h3>

      {editing ? (
        <div style={{ color: '#222' }}>
          <label>가게명: <input value={form.restaurantName || userInfo?.meta?.restaurantName || userInfo?.display_name || userInfo?.name || restaurantName || ''} onChange={(e) => {
            setForm(prev => ({ ...prev, restaurantName: e.target.value }));
          }} /></label><br />
          <label>전화번호: <input value={form.phone} onChange={(e) => {
            setForm(prev => ({ ...prev, phone: e.target.value }));
          }} /></label><br />
          <label>설명: <textarea value={form.description} onChange={(e) => {
            setForm(prev => ({ ...prev, description: e.target.value }));
          }} /></label><br />
          <label>테이블 수: <input type="number" value={form.tableCount} onChange={(e) => {
            setForm(prev => ({ ...prev, tableCount: Number(e.target.value) }));
          }} /></label><br />
          <button onClick={handleUpdate}>저장</button>
        </div>
      ) : (
        <div style={{ color: '#222' }}>
          <p>가게명: {form.restaurantName || userInfo?.meta?.restaurantName || userInfo?.display_name || userInfo?.name || restaurantName || ''}</p>
          <p>전화번호: {userInfo?.meta?.phone}</p>
          <p>설명: {userInfo?.meta?.description}</p>
          <h4>테이블별 URL</h4>
          {storeSlug && tableUrls.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {tableUrls.map((url, idx) => (
                <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                  <h5 style={{ margin: '0 0 12px 0' }}>테이블 {idx + 1}</h5>
                  <div style={{ marginBottom: 12 }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', wordBreak: 'break-all' }}>
                      {decodeURIComponent(url)}
                    </a>
                  </div>
                  <QRCodeGenerator url={url} title={`테이블 ${idx + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <p>테이블 URL을 생성하는 중...</p>
          )}
        </div>
      )}

      <hr />

      <h4>오늘 매출</h4>
      <p>총 주문: {todayOrderCount}건</p>
      <p>총 매출액: {todaySales.toLocaleString()}원</p>
    </div>
  );
} 