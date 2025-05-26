import React, { useEffect, useState, useMemo } from 'react';
import { FaCog } from 'react-icons/fa';
import axios from 'axios';

export default function StoreInfoTab({ tableCount, setTableCount, orders = [] }) {
  const [userInfo, setUserInfo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const email = localStorage.getItem('user_email');
    if (email) {
      axios.get(`http://localhost:5001/api/user-info?email=${email}`)
        .then(res => {
          const meta = res.data.meta || {};
          console.log('서버 응답 데이터:', res.data);
          console.log('메타 데이터:', meta);

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
            name: meta.restaurantName || '',
            phone: meta.phone || '',
            domain: meta.domain || '',
            description: meta.description || '',
            tableCount: meta.tableCount || 1,
            menus: parsedMenus,
            categories: parsedCategories,
          });
        })
        .catch(err => {
          console.error('사용자 정보 불러오기 실패:', err);
        });
    }
  }, []);

  useEffect(() => {
    console.log('form 상태 최신:', form);
  }, [form]);

  const handleUpdate = () => {
    const email = localStorage.getItem('user_email');
    const updateData = {
      email,
      meta: {
        phone: form.phone,
        restaurantName: form.name,
        domain: form.domain,
        description: form.description,
        tableCount: form.tableCount,
        menus: Array.isArray(form.menus) ? form.menus.map(m => ({ name: m.name, price: m.price })) : [],
        categories: Array.isArray(form.categories) ? form.categories : []
      }
    };
    console.log('저장할 데이터:', updateData);

    axios.post('http://localhost:5001/api/update-user-info', updateData)
    .then(response => {
      console.log('저장 응답:', response.data);
      // 저장 성공 후 최신 정보 다시 불러오기
      return axios.get(`http://localhost:5001/api/user-info?email=${email}`);
    })
    .then(res => {
      console.log('새로 불러온 사용자 정보:', res.data);
      const meta = res.data.meta || {};
      
      // 메뉴와 카테고리 파싱
      const parsedMenus = typeof meta.menus === 'string' ? JSON.parse(meta.menus) : (meta.menus || []);
      const parsedCategories = typeof meta.categories === 'string' ? JSON.parse(meta.categories) : (meta.categories || []);
      
      // 상태 업데이트
      setUserInfo({
        ...res.data,
        meta: {
          ...meta,
          menus: parsedMenus,
          categories: parsedCategories
        }
      });
      
      setForm({
        name: meta.restaurantName || res.data.name || '',
        phone: meta.phone || '',
        domain: meta.domain || '',
        description: meta.description || '',
        tableCount: meta.tableCount || 1,
        menus: parsedMenus,
        categories: parsedCategories,
      });
      
      alert('수정 완료');
      setEditing(false);
      if (setTableCount) setTableCount(form.tableCount);
    })
    .catch(err => {
      console.error('저장 실패:', err);
      alert('수정 실패: ' + err.message);
    });
  };

  // 테이블별 URL 동적 생성
  const storeSlug = useMemo(() => {
    const restaurantName = form?.name || '';
    console.log('✅ 슬러그 생성용 이름:', restaurantName);

    if (!restaurantName) return '';
    // 1. 특수문자 제거, 2. 공백 -> 하이픈, 3. 한글 전체 인코딩
    let step1 = restaurantName.replace(/[^a-zA-Z0-9가-힣\s]/g, '');
    let step2 = step1.replace(/\s+/g, '-');
    let step3 = step2.replace(/[가-힣]+/g, (match) => encodeURIComponent(match));
    console.log('step1:', step1);
    console.log('step2:', step2);
    console.log('step3:', step3);
    return step3;
  }, [form?.name]);

  const tableUrls = useMemo(() => {
    if (!storeSlug || !form.tableCount) return [];
    return Array.from({ length: form.tableCount }, (_, i) =>
      `${window.location.origin}/order/${storeSlug}/table-${i + 1}`
    );
  }, [storeSlug, form.tableCount]);

  console.log('✅ storeSlug:', storeSlug);
  console.log('✅ tableUrls:', tableUrls);

  // 오늘 매출 연동
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysOrders = (orders || []).filter(order => order.timestamp && order.timestamp.slice(0, 10) === todayStr);
  const todaySales = todaysOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const todayOrderCount = todaysOrders.length;

  return (
    <div style={{ border: '1px solid #ccc', padding: 20, color: '#222' }}>
      <h3>
        가게 정보 <button onClick={() => setEditing(!editing)}><FaCog /> 수정</button>
      </h3>

      {editing ? (
        <div style={{ color: '#222' }}>
          <label>가게명: <input value={form.name} onChange={(e) => {
            setForm(prev => ({ ...prev, name: e.target.value }));
          }} /></label><br />
          <label>전화번호: <input value={form.phone} onChange={(e) => {
            setForm(prev => ({ ...prev, phone: e.target.value }));
          }} /></label><br />
          <label>도메인: <input value={form.domain} onChange={(e) => {
            setForm(prev => ({ ...prev, domain: e.target.value }));
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
          <p>가게명: {userInfo?.meta?.restaurantName || userInfo?.name}</p>
          <p>전화번호: {userInfo?.meta?.phone}</p>
          <p>도메인: {userInfo?.meta?.domain}</p>
          <p>설명: {userInfo?.meta?.description}</p>
          <h4>테이블별 URL</h4>
          {storeSlug && tableUrls.length > 0 ? (
            <ul>
              {tableUrls.map((url, idx) => (
                <li key={idx}>
                  테이블 {idx + 1} - <a href={url} target="_blank" rel="noopener noreferrer">{decodeURIComponent(url)}</a>
                </li>
              ))}
            </ul>
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