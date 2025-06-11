const express = require('express');
const router = express.Router();
const axios = require('axios');

const WP_API_URL = process.env.WP_API_URL || 'http://localhost:8000/wp-json';
const WP_API_USERNAME = process.env.WP_API_USERNAME;
const WP_API_PASSWORD = process.env.WP_API_PASSWORD;

// 이메일로 사용자 정보 조회 (커스텀 엔드포인트 사용)
router.get('/user-info', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: '이메일이 필요합니다.' });
  }
  try {
    const response = await axios.get(`${WP_API_URL}/custom/v1/user-by-email`, {
      params: { email },
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error('사용자 정보 조회 실패:', err.response?.data || err.message, err.stack);
    res.status(500).json({ error: '사용자 정보 조회 실패', detail: err.response?.data || err.message });
  }
});

// 사용자 정보(메타) 업데이트
router.post('/update-user-info', async (req, res) => {
  const { email, meta } = req.body;
  if (!email || !meta) {
    return res.status(400).json({ error: '이메일과 meta 정보가 필요합니다.' });
  }
  try {
    // 1. 이메일로 사용자 조회
    const userRes = await axios.get(`${WP_API_URL}/custom/v1/user-by-email`, {
      params: { email },
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    const userId = userRes.data.ID;
    if (!userId) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    // tableCount를 강제 정수로 변환
    if (meta.tableCount !== undefined) {
      meta.tableCount = parseInt(meta.tableCount, 10) || 1;
    }
    console.log('워드프레스로 전송할 meta:', meta, typeof meta.tableCount, meta.tableCount);
    // 2. 사용자 메타 업데이트
    const updateRes = await axios.post(
      `${WP_API_URL}/wp/v2/users/${userId}`,
      { meta },
      {
        auth: {
          username: WP_API_USERNAME,
          password: WP_API_PASSWORD
        }
      }
    );
    res.json({ message: '사용자 정보 업데이트 성공', data: updateRes.data });
  } catch (err) {
    console.error('사용자 정보 업데이트 실패:', err.response?.data || err.message);
    res.status(500).json({ error: '사용자 정보 업데이트 실패', detail: err.response?.data || err.message });
  }
});

// [가게명으로 accountId(워드프레스 사용자 id) 반환 API]
router.get('/get-account-id', async (req, res) => {
  let { storeName } = req.query;
  if (!storeName) return res.status(400).json({ error: 'storeName이 필요합니다.' });
  try {
    // storeName을 반드시 디코딩
    storeName = decodeURIComponent(storeName);
    // 워드프레스 사용자 전체 조회
    const response = await axios.get(`${WP_API_URL}/wp/v2/users`, {
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    // restaurantName(가게명) 또는 name이 정확히 일치하는 사용자 찾기
    const matched = response.data.find(user => {
      const metaName = Array.isArray(user.meta?.restaurantName) ? user.meta.restaurantName[0] : user.meta?.restaurantName;
      return metaName === storeName || user.name === storeName || user.username === storeName;
    });
    if (!matched) return res.status(404).json({ error: '해당 가게명을 가진 사용자를 찾을 수 없습니다.' });
    res.json({ accountId: matched.id });
  } catch (err) {
    console.error('❌ /api/get-account-id 오류:', err.response?.data || err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// [accountId로 카테고리 목록 반환 API]
router.get('/get-categories-by-store', async (req, res) => {
  const { accountId } = req.query;
  if (!accountId) return res.status(400).json({ error: 'accountId가 필요합니다.' });
  try {
    // 워드프레스 사용자 조회
    const userRes = await axios.get(`${WP_API_URL}/wp/v2/users/${accountId}`, {
      auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
    });
    const user = userRes.data;
    // restaurantName으로 통일
    const restaurantName = Array.isArray(user.meta?.restaurantName) ? user.meta.restaurantName[0] : user.meta?.restaurantName || user.name || user.username;
    if (!restaurantName) return res.status(404).json({ error: '가게명을 찾을 수 없습니다.' });

    // WooCommerce 카테고리 전체 조회
    const catRes = await axios.get(`${WP_API_URL.replace('/wp-json','')}/wp-json/wc/v3/products/categories`, {
      auth: {
        username: process.env.WC_ADMIN_KEY,
        password: process.env.WC_ADMIN_SECRET
      }
    });
    const filtered = catRes.data.filter(cat =>
      decodeURIComponent(cat.name).startsWith(`${restaurantName}_`)
    );
    res.json(filtered);
  } catch (err) {
    console.error('❌ /api/get-categories-by-store 오류:', err.response?.data || err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// [카테고리 slug로 메뉴(상품) 목록 반환 API]
router.get('/get-products-by-category', async (req, res) => {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'slug가 필요합니다.' });
  try {
    // WooCommerce 카테고리 전체 조회
    const catRes = await axios.get(`${WP_API_URL.replace('/wp-json','')}/wp-json/wc/v3/products/categories`, {
      auth: {
        username: process.env.WC_ADMIN_KEY,
        password: process.env.WC_ADMIN_SECRET
      }
    });
    const matchedCategory = catRes.data.find(cat =>
      decodeURIComponent(cat.slug) === decodeURIComponent(slug)
    );
    if (!matchedCategory) return res.status(404).json({ error: '해당 카테고리를 찾을 수 없습니다.' });

    // WooCommerce 상품 전체 조회
    const prodRes = await axios.get(`${WP_API_URL.replace('/wp-json','')}/wp-json/wc/v3/products`, {
      auth: {
        username: process.env.WC_ADMIN_KEY,
        password: process.env.WC_ADMIN_SECRET
      }
    });
    // 해당 카테고리 id가 포함된 상품만 반환
    const filtered = prodRes.data.filter(product =>
      Array.isArray(product.categories) &&
      product.categories.some(c => c.id === matchedCategory.id)
    );
    res.json(filtered);
  } catch (err) {
    console.error('❌ /api/get-products-by-category 오류:', err.response?.data || err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 카테고리 생성 API
router.post('/create-category', async (req, res) => {
  const { accountId, categoryName } = req.body;
  if (!accountId || !categoryName) {
    return res.status(400).json({ error: 'accountId와 categoryName이 필요합니다.' });
  }
  try {
    // 워드프레스 사용자 조회
    const userRes = await axios.get(`${WP_API_URL}/wp/v2/users/${accountId}`, {
      auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
    });
    const user = userRes.data;
    const restaurantName = Array.isArray(user.meta?.restaurantName) ? user.meta.restaurantName[0] : user.meta?.restaurantName || user.name || user.username;
    if (!restaurantName) return res.status(404).json({ error: '가게명을 찾을 수 없습니다.' });

    // 카테고리명/슬러그 생성
    const fullCategoryName = `${restaurantName}_${categoryName}`;
    const fullCategorySlug = `${restaurantName}-${categoryName}`.toLowerCase();

    // WooCommerce 카테고리 생성
    const createRes = await axios.post(
      `${WP_API_URL.replace('/wp-json','')}/wp-json/wc/v3/products/categories`,
      { name: fullCategoryName, slug: fullCategorySlug },
      {
        auth: {
          username: process.env.WC_ADMIN_KEY,
          password: process.env.WC_ADMIN_SECRET
        }
      }
    );
    res.json(createRes.data);
  } catch (err) {
    console.error('❌ /api/create-category 오류:', err.response?.data || err.message);
    res.status(500).json({ error: '카테고리 생성 실패', detail: err.response?.data || err.message });
  }
});

// 메뉴/카테고리 정보 저장 API
router.post('/save-menu', async (req, res) => {
  try {
    console.log('[save-menu] req.body:', req.body); // 실제 전달값 확인
    const { email, menus, categories } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email이 필요합니다.' });
    }
    // 1. 이메일로 사용자 조회
    const userRes = await axios.get(`${WP_API_URL}/custom/v1/user-by-email`, {
      params: { email },
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    const userId = userRes.data.ID;
    if (!userId) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    // 2. 사용자 메타 업데이트
    const meta = {};
    if (menus !== undefined) meta.menus = JSON.stringify(menus);
    if (categories !== undefined) meta.categories = JSON.stringify(categories);
    const updateRes = await axios.post(
      `${WP_API_URL}/wp/v2/users/${userId}`,
      { meta },
      {
        auth: {
          username: WP_API_USERNAME,
          password: WP_API_PASSWORD
        }
      }
    );
    res.json({ message: '메뉴/카테고리 저장 성공', data: updateRes.data });
  } catch (err) {
    console.error('[save-menu] error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router; 