import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function OrderPage() {
  const { accountId, tableId } = useParams();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 카테고리 불러오기
        const catRes = await axios.get('http://localhost:5001/api/get-categories');
        const myCategories = catRes.data.filter(cat => cat.slug.startsWith(accountId));
        const myCategoryIds = myCategories.map(cat => cat.id);
        console.log('🔖 내 카테고리:', myCategories.map(c => c.name));

        // 2. 상품 불러오기
        const prodRes = await axios.get('http://localhost:5001/api/get-products');
        console.log('📦 전체 WooCommerce 상품 구조:', prodRes.data);

        // 3. 내 카테고리에 속한 상품만 필터링
        const filteredProducts = prodRes.data.filter(product =>
          product.categories.some(cat => myCategoryIds.includes(cat.id))
        );
        console.log('🧪 필터링된 상품:', filteredProducts.map(p => p.slug));
        setProducts(filteredProducts);
      } catch (err) {
        console.error('❌ 메뉴/카테고리 불러오기 실패:', err.response?.data || err.message);
      }
    };
    fetchData();
  }, [accountId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>메뉴 선택 (테이블 {tableId})</h2>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <strong>{product.name}</strong> - {product.regular_price}원
            <button onClick={() => addToCart(product)} style={{ marginLeft: 10 }}>추가</button>
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