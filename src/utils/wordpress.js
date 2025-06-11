import axios from "axios";

// 특수문자 및 공백 제거 함수
const sanitize = (str) => {
  return str.trim().replace(/[^\w가-힣]/g, '').replace(/\s+/g, '');
};

// 워드프레스 REST API 인증 정보 (Vite 환경변수 사용)
const WC_ADMIN_KEY = import.meta.env.VITE_WC_ADMIN_KEY;
const WC_ADMIN_SECRET = import.meta.env.VITE_WC_ADMIN_SECRET;
const WC_SITE_URL = import.meta.env.VITE_SITE_URL || "https://happyfabric02.mycafe24.com";

// 카테고리 생성 함수
export async function createCategory({ storeInfo, category }) {
  const storeName = storeInfo.storeName || '기본가게';
  const cleanStoreName = sanitize(storeName);
  const cleanCategoryName = sanitize(category || '카테고리');

  const categoryName = `${cleanStoreName}_${cleanCategoryName}`;  // 예: bhc_치킨
  const categorySlug = `${cleanStoreName}-${cleanCategoryName}`.toLowerCase();

  // 중복 카테고리 존재 여부 확인
  const existing = await axios.get(`${WC_SITE_URL}/wp-json/wc/v3/products/categories`, {
    auth: {
      username: WC_ADMIN_KEY,
      password: WC_ADMIN_SECRET
    },
    params: {
      slug: categorySlug
    }
  });

  // 존재하지 않을 때만 새 카테고리 생성
  if (existing.data.length === 0) {
    await axios.post(`${WC_SITE_URL}/wp-json/wc/v3/products/categories`, {
      name: categoryName,
      slug: categorySlug
    }, {
      auth: {
        username: WC_ADMIN_KEY,
        password: WC_ADMIN_SECRET
      }
    });
  } else {
    console.log('⚠️ 이미 존재하는 카테고리입니다:', categorySlug);
  }
} 