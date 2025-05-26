import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import bodyParser from 'body-parser';
import { Buffer } from 'buffer';
import admin from 'firebase-admin';

// 환경변수 설정
console.log('✅ WP_BASE_URL:', process.env.WP_BASE_URL);
console.log('✅ WP_ADMIN_USER:', process.env.WP_ADMIN_USER);
console.log('✅ WP_ADMIN_PASS:', process.env.WP_ADMIN_PASS);
console.log('✅ WP_APP_PASSWORD:', process.env.WP_APP_PASSWORD);
console.log('✅ WC_ADMIN_KEY:', process.env.WC_ADMIN_KEY);
console.log('✅ WC_ADMIN_SECRET:', process.env.WC_ADMIN_SECRET);
console.log('✅ WC_PUBLIC_KEY:', process.env.WC_PUBLIC_KEY);
console.log('✅ WC_PUBLIC_SECRET:', process.env.WC_PUBLIC_SECRET);

const app = express();
const PORT = process.env.PORT || 5001;

// WordPress & WooCommerce 설정
const WP_BASE_URL = process.env.WP_BASE_URL;
const WP_ADMIN_USER = process.env.WP_ADMIN_USER;
const WP_ADMIN_PASS = process.env.WP_ADMIN_PASS;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

// WooCommerce 키: 환경변수 누락 시 하드코딩된 기본값으로 대체
const WC_ADMIN_KEY = process.env.WC_ADMIN_KEY || 'ck_389983c516d8f170c86fc422426cfd23771c880f';
const WC_ADMIN_SECRET = process.env.WC_ADMIN_SECRET || 'cs_a8f62f1ca2b8c8f9812024557a2baf5825d847f2';
const WC_PUBLIC_KEY = process.env.WC_PUBLIC_KEY || 'ck_8a572dc6082d6a8d871ece7d44d3ee63d4287ca8';
const WC_PUBLIC_SECRET = process.env.WC_PUBLIC_SECRET || 'cs_d662680aa712e97e5fe6182109c4e4c012af8be2';

// CORS 설정
app.use(cors());
app.use(bodyParser.json());

// WooCommerce API 요청 유틸리티 함수 (관리자용)
const wooAdminRequest = async (endpoint, method = 'get', data = {}) => {
  const url = `${WP_BASE_URL}/wp-json/wc/v3/${endpoint}`;
  const auth = {
    username: WC_ADMIN_KEY,
    password: WC_ADMIN_SECRET
  };
  try {
    const res = await axios({ url, method, data, auth });
    return res.data;
  } catch (err) {
    console.error(`❌ WooCommerce 관리자 API 실패 [${method.toUpperCase()} ${endpoint}]`, err.response?.data || err.message);
    throw err;
  }
};

// WooCommerce API 요청 유틸리티 함수 (공개용)
const wooPublicRequest = async (endpoint, method = 'get', data = {}) => {
  const url = `${WP_BASE_URL}/wp-json/wc/v3/${endpoint}`;
  const auth = {
    username: WC_PUBLIC_KEY,
    password: WC_PUBLIC_SECRET
  };
  try {
    const res = await axios({ url, method, data, auth });
    return res.data;
  } catch (err) {
    console.error(`❌ WooCommerce 공개 API 실패 [${method.toUpperCase()} ${endpoint}]`, err.response?.data || err.message);
    throw err;
  }
};

// 사용자 정보 조회 API
app.get('/api/user-info', async (req, res) => {
  const { email } = req.query;
  try {
    const userResponse = await axios.get(`${WP_BASE_URL}/wp-json/wp/v2/users?search=${email}`, {
      auth: {
        username: WP_ADMIN_USER,
        password: WP_ADMIN_PASS
      }
    });

    if (userResponse.data.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = userResponse.data[0];
    res.json({
      email: user.email,
      meta: user.meta || {},
      id: user.id,
      name: user.name || user.username
    });
  } catch (err) {
    console.error('❌ 사용자 정보 가져오기 실패:', err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// 사용자 정보 업데이트 API
app.post('/api/update-user-info', async (req, res) => {
  const { email, meta } = req.body;
  try {
    const userResponse = await axios.get(`${WP_BASE_URL}/wp-json/wp/v2/users?search=${email}`, {
      auth: {
        username: WP_ADMIN_USER,
        password: WP_ADMIN_PASS
      }
    });

    if (userResponse.data.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const userId = userResponse.data[0].id;
    const updateRes = await axios.post(
      `${WP_BASE_URL}/wp-json/wp/v2/users/${userId}`,
      { meta },
      {
        auth: {
          username: WP_ADMIN_USER,
          password: WP_ADMIN_PASS
        }
      }
    );

    res.json({ message: '사용자 정보 업데이트 성공', data: updateRes.data });
  } catch (err) {
    console.error('❌ 사용자 업데이트 중 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 회원가입 프록시 라우터
app.post('/api/register', async (req, res) => {
  const { username, email, password, name, phone, restaurantName, location } = req.body;

  try {
    // WordPress 사용자 생성
    const createUserResponse = await axios.post(
      `${WP_BASE_URL}/wp-json/wp/v2/users`,
      {
        username,
        email,
        password,
        name,
        roles: ['editor'],
        meta: {
          phone,
          restaurantName,
          location
        }
      },
      {
        auth: {
          username: WP_ADMIN_USER,
          password: WP_ADMIN_PASS
        }
      }
    );

    const user_id = createUserResponse.data.id;

    // 사용자 메타 정보 저장
    const metaData = {
      menus: req.body.menus || [],
      categories: req.body.categories || [],
      tableCount: req.body.tableCount || 0
    };

    try {
      const updateUserMeta = await axios.post(
        `${WP_BASE_URL}/wp-json/wp/v2/users/${user_id}`,
        { meta: metaData },
        {
          auth: {
            username: WP_ADMIN_USER,
            password: WP_ADMIN_PASS
          }
        }
      );
      console.log('✅ 사용자 메타 정보 저장 완료:', updateUserMeta.data.meta);
    } catch (err) {
      console.error('❌ 사용자 메타 저장 실패:', err.response?.data || err.message);
    }

    // 매장 페이지 생성
    const pageResponse = await axios.post(
      `${WP_BASE_URL}/wp-json/wp/v2/pages`,
      {
        title: restaurantName,
        content: `매장 위치: ${location}`,
        status: 'publish',
        slug: restaurantName
          ? `store-${restaurantName.toLowerCase().replace(/\s+/g, '-')}`
          : `store-unknown-${Date.now()}`
      },
      {
        auth: {
          username: WP_ADMIN_USER,
          password: WP_ADMIN_PASS
        }
      }
    );

    res.json({
      user: createUserResponse.data,
      page: pageResponse.data
    });
  } catch (err) {
    console.error('회원가입 실패:', err.response?.data || err.message);
    res.status(500).json({ error: '회원가입에 실패했습니다.' });
  }
});

app.post('/api/save-order', async (req, res) => {
  const { tableNumber, menuItems, totalAmount } = req.body;
  const pathname = req.headers.referer || '';
  const slugMatch = pathname.match(/store-([^/]+)/);
  const slug = slugMatch ? slugMatch[1] : null;

  if (!slug) return res.status(400).json({ error: 'slug 없음' });

  try {
    // 🔍 슬러그로 사용자 정보 조회
    const users = await axios.get(`${WP_BASE_URL}/wp-json/wp/v2/users`, { auth: { username: WP_ADMIN_USER, password: WP_ADMIN_PASS } });
    const matchedUser = users.data.find(u => u.slug === slug);

    if (!matchedUser) return res.status(404).json({ error: '사용자 없음' });

    const userId = matchedUser.id;
    const timestamp = new Date().toISOString();

    // 📝 주문 정보 저장
    const response = await axios.post(`${WP_BASE_URL}/wp-json/wp/v2/order`, {
      title: `Table ${tableNumber} - ${timestamp}`,
      status: 'publish',
      fields: {
        tableNumber,
        menuItems: JSON.stringify(menuItems),
        totalAmount
      },
      author: userId
    }, { auth: { username: WP_ADMIN_USER, password: WP_ADMIN_PASS } });

    console.log('✅ 주문 저장 완료:', response.data.id);
    res.json({ success: true, orderId: response.data.id });

  } catch (err) {
    console.error('❌ 주문 저장 실패:', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// slug로 사용자 조회 API
app.get('/api/user-info-by-slug', async (req, res) => {
  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug 누락' });

  try {
    // 모든 사용자 조회
    const response = await axios.get(`${WP_BASE_URL}/wp-json/wp/v2/users`, {
      auth: {
        username: WP_ADMIN_USER,
        password: WP_ADMIN_PASS
      }
    });

    // slug가 일치하는 사용자 찾기
    const matched = response.data.find(user => user.slug === slug);
    if (!matched) return res.status(404).json({ error: '사용자 없음' });

    res.json(matched);
  } catch (err) {
    console.error('슬러그로 사용자 조회 실패:', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// [임시 진단용] 메뉴/카테고리 저장 라우트
app.post('/api/save-menu', (req, res) => {
  const { email, menus, categories } = req.body;
  console.log('📥 [save-menu] 요청 수신:', email);
  console.log('→ 저장할 메뉴:', menus);
  console.log('→ 저장할 카테고리:', categories);

  // 실제 저장 로직은 생략 (현재는 콘솔 출력으로만 진단용 사용)
  return res.status(200).json({ message: '저장 성공' });
});

// [WooCommerce 카테고리 생성 API]
app.post('/api/create-category', async (req, res) => {
  const { name, email } = req.body;
  try {
    const uniqueName = `${email}_${name}`;
    const uniqueSlug = `${email}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    const existing = await wooAdminRequest('products/categories', 'get');
    const found = existing.find(cat => cat.name === uniqueName);
    if (found) return res.status(200).json(found);
    
    const response = await wooAdminRequest('products/categories', 'post', {
      name: uniqueName,
      slug: uniqueSlug
    });
    res.json(response);
  } catch (err) {
    console.error('❌ 카테고리 생성 실패:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// [메뉴 조회 API]
app.get('/api/fetch-menus', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: '이메일이 필요합니다.' });

  try {
    const response = await axios.get(`${WP_BASE_URL}/wp-json/wp/v2/users?search=${email}`, {
      auth: { username: WP_ADMIN_USER, password: WP_ADMIN_PASS }
    });

    if (!response.data.length) return res.status(404).json({ error: '사용자 없음' });

    const user = response.data[0];
    const meta = user.meta || {};
    const menus = meta.menus ? JSON.parse(meta.menus) : [];
    const categories = meta.categories ? JSON.parse(meta.categories) : [];

    res.json({ menus, categories });
  } catch (err) {
    console.error('❌ 메뉴 불러오기 실패:', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// [WooCommerce 메뉴(상품) 생성 API]
app.post('/api/create-menu', async (req, res) => {
  const { name, price, categoryId } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: '메뉴 이름과 가격은 필수입니다.' });
  }
  try {
    const response = await wooAdminRequest('products', 'post', {
      name,
      type: 'simple',
      regular_price: String(price),
      categories: categoryId ? [{ id: categoryId }] : []
    });
    res.json(response);
  } catch (err) {
    console.error('❌ 메뉴 생성 실패:', err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// [공개 조회] 상품 목록
app.get('/api/get-products', async (req, res) => {
  const { accountId } = req.query;
  try {
    const products = await wooPublicRequest('products');
    let filteredProducts = products;
    if (accountId) {
      filteredProducts = products.filter(product =>
        product.categories.some(cat =>
          decodeURIComponent(cat.slug || '').toLowerCase().startsWith(accountId)
        )
      );
    }
    res.json(filteredProducts);
  } catch (err) {
    console.error('❌ [get-products] 상품 로드 실패:', err.response?.data || err.message);
    res.status(500).json({ message: '상품 요청 실패', error: err.message });
  }
});

// [공개 조회] 카테고리 목록
app.get('/api/get-categories', async (req, res) => {
  const { accountId } = req.query;
  try {
    const categories = await wooPublicRequest('products/categories');
    const filtered = categories.filter(cat => cat.name.startsWith(`${accountId}_`));
    res.json(filtered);
  } catch (err) {
    console.error('❌ get-categories 오류:', err.message);
    res.status(500).json({ message: '카테고리 조회 실패' });
  }
});

app.get('/api/get-account-id', async (req, res) => {
  const { storeName } = req.query;
  if (!storeName) return res.status(400).json({ message: 'storeName 누락' });
  try {
    // 예시: Firebase Realtime DB에서 storeName → accountId 매핑 조회
    const snapshot = await admin.database().ref('stores').orderByChild('storeName').equalTo(storeName).once('value');
    const data = snapshot.val();
    if (!data) return res.status(404).json({ message: '매장 정보 없음' });
    const accountId = Object.keys(data)[0];
    res.json({ accountId });
  } catch (err) {
    console.error('❌ 매장 정보 조회 실패:', err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('✅ 회원가입 프록시 서버 실행 중: http://localhost:' + PORT);
});