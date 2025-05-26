import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function OrderPage() {
  const { storeSlug, tableId } = useParams();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const storeName = decodeURIComponent(storeSlug);
      const accountId = storeName.replace(/[@.]/g, '').toLowerCase();

      try {
        const catRes = await axios.get(`/api/get-categories?accountId=${accountId}`);
        const categories = catRes.data;

        if (!Array.isArray(categories)) {
          console.error('❌ 카테고리 응답 오류:', categories);
          setProducts([]);
          return;
        }

        const categoryIds = categories.map(c => c.id);
        const prodRes = await axios.get(`/api/get-products?accountId=${accountId}`);
        setProducts(prodRes.data);
      } catch (err) {
        console.error('❌ 메뉴/카테고리 불러오기 실패:', err.message);
        setProducts([]);
      }
    };

    fetchData();
  }, [storeSlug]);

  const addToCart = (menu) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === menu.id);
      if (exists) {
        return prev.map(item =>
          item.id === menu.id ? { ...item, count: item.count + 1 } : item
        );
      } else {
        return [...prev, { ...menu, count: 1 }];
      }
    });
  };

  const handleOrderSubmit = async () => {
    try {
      const response = await axios.post('/api/submit-order', {
        store: storeSlug,
        table: tableId,
        menus: cart,
        total: cart.reduce((sum, item) => sum + item.count * Number(item.regular_price), 0),
        timestamp: new Date().toISOString()
      });
      alert('주문이 접수되었습니다!');
      setCart([]);
    } catch (err) {
      alert('주문 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>메뉴 선택 (테이블 {tableId})</h2>
      <ul>
        {products.map(menu => (
          <li key={menu.id}>
            <strong>{menu.name}</strong> - {menu.regular_price}원
            <button onClick={() => addToCart(menu)} style={{ marginLeft: 10 }}>추가</button>
          </li>
        ))}
      </ul>
      <hr />
      <h3>장바구니</h3>
      <ul>
        {cart.map(item => (
          <li key={item.id}>{item.name} x {item.count}</li>
        ))}
      </ul>
      <p>총액: {cart.reduce((sum, item) => sum + item.count * Number(item.regular_price), 0)}원</p>
      <button onClick={handleOrderSubmit}>주문하기</button>
    </div>
  );
} 