import React, { useState, useEffect } from 'react';

const saveStoreMeta = async (storeId, tableCount, restaurantName) => {
  try {
    console.log('📤 [saveStoreMeta] 저장 요청 시작', {
      storeId,
      tableCount,
      restaurantName
    });

    const response = await fetch(`/api/store/${storeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta: {
          tableCount,
          restaurantName,
        },
      }),
    });

    // 추가: 실제 전송된 payload 로그
    console.log('📤 저장 요청 payload 확인:', {
      storeId,
      tableCount,
      restaurantName,
    });

    const result = await response.json();
    console.log('✅ [saveStoreMeta] 저장 완료 응답:', result);
  } catch (error) {
    console.error('❌ [saveStoreMeta] 저장 실패:', error);
  }
};

const OwnerDashboard = ({ user }) => {
  const [store, setStore] = useState(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        if (!user || !user.storeId) {
          console.warn('⚠️ user 또는 storeId가 없음');
          return;
        }

        const res = await fetch(`/api/store/${user.storeId}`);
        const data = await res.json();

        console.log('📥 [fetchStoreData] 사용자 store 정보 응답:', data);

        // 1. tableCount는 항상 data.meta에서만 가져옴
        const tableCount = parseInt(data.meta?.tableCount, 10) || 0;

        // 2. storeName 우선순위: restaurantName > user.slug > fallback
        let storeName = data.meta?.restaurantName?.trim();
        if (!storeName) {
          console.warn('⛔ restaurantName이 없음. user.slug 또는 fallback 사용');
          storeName = user.slug || 'unknown-store';
        } else {
          console.log('✅ restaurantName 사용:', storeName);
        }

        // restaurantName이 존재하더라도 항상 저장 (초기화 방지 목적)
        await saveStoreMeta(user.storeId, tableCount, storeName);
        console.log('📦 [fetchStoreData] saveStoreMeta 호출 완료');

        // 3. URL은 storeName 기반으로 항상 실시간 생성 (저장하지 않음)
        const baseURL = `http://localhost:5173/order/${storeName}`;
        const tableUrls = Array.from({ length: tableCount }, (_, i) => `${baseURL}/table-${i + 1}`);

        // 4. 최종 상태 설정
        setStore({
          ...data,
          name: storeName,
          tableUrls,
          url: baseURL,
        });
      } catch (err) {
        console.error('❌ 가게 정보 불러오기 실패:', err);
      }
    };

    fetchStoreData();
  }, [user]);

  return (
    <div>
      <h1>대시보드</h1>
      {store ? (
        <div>
          <h2>가게 정보</h2>
          <p>가게명: {store.name}</p>
          {store && store.url ? (
            <p>URL: {store.url}</p>
          ) : (
            <p>URL 정보가 없습니다.</p>
          )}
          {store && (
            <div>
              <h3>테이블별 URL</h3>
              {store.tableUrls && store.tableUrls.length > 0 ? (
                store.tableUrls.map((url, index) => (
                  <p key={index}>테이블 {index + 1}: {url}</p>
                ))
              ) : (
                <p>❌ 테이블 URL 정보가 없습니다.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p>가게 정보를 불러오는 중...</p>
      )}
    </div>
  );
};

export default OwnerDashboard; 