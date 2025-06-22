import axios from 'axios';

const WP_API_URL = process.env.WP_API_URL;
const WP_API_USERNAME = process.env.WP_API_USERNAME;
const WP_API_PASSWORD = process.env.WP_API_PASSWORD;
const WC_ADMIN_KEY = process.env.WC_ADMIN_KEY;
const WC_ADMIN_SECRET = process.env.WC_ADMIN_SECRET;

function cleanWpJsonUrl(url) {
  return url.replace(/\/wp-json\/wp-json\//, '/wp-json/');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET /api/user-info?email=...
  if (req.method === 'GET' && req.query['user-info'] !== undefined) {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: '이메일이 필요합니다.' });
    try {
      const response = await axios.get(cleanWpJsonUrl(`${WP_API_URL}/custom/v1/user-by-email`), {
        params: { email },
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      res.status(200).json(response.data);
    } catch (err) {
      res.status(500).json({ error: '사용자 정보 조회 실패', detail: err.response?.data || err.message });
    }
    return;
  }

  // POST /api/update-user-info
  if (req.method === 'POST' && req.query['update-user-info'] !== undefined) {
    const { email, meta } = req.body;
    if (!email || !meta) return res.status(400).json({ error: '이메일과 meta 정보가 필요합니다.' });
    try {
      const userRes = await axios.get(cleanWpJsonUrl(`${WP_API_URL}/custom/v1/user-by-email`), {
        params: { email },
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      const userId = userRes.data.ID;
      if (!userId) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      if (meta.tableCount !== undefined) meta.tableCount = parseInt(meta.tableCount, 10) || 1;
      const updateRes = await axios.post(
        cleanWpJsonUrl(`${WP_API_URL}/wp/v2/users/${userId}`),
        { meta },
        { auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD } }
      );
      res.status(200).json({ message: '사용자 정보 업데이트 성공', data: updateRes.data });
    } catch (err) {
      res.status(500).json({ error: '사용자 정보 업데이트 실패', detail: err.response?.data || err.message });
    }
    return;
  }

  // GET /api/get-account-id?storeName=...
  if (req.method === 'GET' && req.query['get-account-id'] !== undefined) {
    let { storeName } = req.query;
    if (!storeName) return res.status(400).json({ error: 'storeName이 필요합니다.' });
    try {
      storeName = decodeURIComponent(storeName);
      const response = await axios.get(cleanWpJsonUrl(`${WP_API_URL}/wp/v2/users`), {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      const matched = response.data.find(user => {
        const metaName = Array.isArray(user.meta?.restaurantName) ? user.meta.restaurantName[0] : user.meta?.restaurantName;
        return metaName === storeName || user.name === storeName || user.username === storeName;
      });
      if (!matched) return res.status(404).json({ error: '해당 가게명을 가진 사용자를 찾을 수 없습니다.' });
      res.status(200).json({ accountId: matched.id });
    } catch (err) {
      res.status(500).json({ error: '서버 오류' });
    }
    return;
  }

  // GET /api/get-categories-by-store?accountId=...
  if (req.method === 'GET' && req.query['get-categories-by-store'] !== undefined) {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId가 필요합니다.' });
    try {
      const userRes = await axios.get(cleanWpJsonUrl(`${WP_API_URL}/wp/v2/users/${accountId}`), {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      const user = userRes.data;
      const restaurantName = Array.isArray(user.meta?.restaurantName) ? user.meta.restaurantName[0] : user.meta?.restaurantName || user.name || user.username;
      if (!restaurantName) return res.status(404).json({ error: '가게명을 찾을 수 없습니다.' });
      const catRes = await axios.get(cleanWpJsonUrl(`${WP_API_URL.replace('/wp-json','')}/wp-json/wc/v3/products/categories`), {
        auth: { username: WC_ADMIN_KEY, password: WC_ADMIN_SECRET }
      });
      const filtered = catRes.data.filter(cat =>
        decodeURIComponent(cat.name).startsWith(`${restaurantName}_`)
      );
      res.status(200).json(filtered);
    } catch (err) {
      res.status(500).json({ error: '서버 오류' });
    }
    return;
  }

  // GET /api/get-products-by-category?slug=...
  if (req.method === 'GET' && req.query['get-products-by-category'] !== undefined) {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: 'slug가 필요합니다.' });
    try {
      const catRes = await axios.get(cleanWpJsonUrl(`${WP_API_URL.replace('/wp-json','')}/wp-json/wc/v3/products/categories`), {
        auth: { username: WC_ADMIN_KEY, password: WC_ADMIN_SECRET }
      });
      const matchedCategory = catRes.data.find(cat =>
        decodeURIComponent(cat.slug) === decodeURIComponent(slug)
      );
      if (!matchedCategory) return res.status(404).json({ error: '해당 카테고리를 찾을 수 없습니다.' });
      const prodRes = await axios.get(cleanWpJsonUrl(`${WP_API_URL.replace('/wp-json','')}/wp-json/wc/v3/products`), {
        auth: { username: WC_ADMIN_KEY, password: WC_ADMIN_SECRET }
      });
      const filtered = prodRes.data.filter(product =>
        Array.isArray(product.categories) &&
        product.categories.some(c => c.id === matchedCategory.id)
      );
      res.status(200).json(filtered);
    } catch (err) {
      res.status(500).json({ error: '서버 오류' });
    }
    return;
  }

  // POST /api/create-category
  if (req.method === 'POST' && req.query['create-category'] !== undefined) {
    const { accountId, categoryName } = req.body;
    if (!accountId || !categoryName) return res.status(400).json({ error: 'accountId와 categoryName이 필요합니다.' });
    try {
      const userRes = await axios.get(cleanWpJsonUrl(`${WP_API_URL}/wp/v2/users/${accountId}`), {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      const user = userRes.data;
      const restaurantName = Array.isArray(user.meta?.restaurantName) ? user.meta.restaurantName[0] : user.meta?.restaurantName || user.name || user.username;
      if (!restaurantName) return res.status(404).json({ error: '가게명을 찾을 수 없습니다.' });
      const fullCategoryName = `${restaurantName}_${categoryName}`;
      const fullCategorySlug = `${restaurantName}-${categoryName}`.toLowerCase();
      const createRes = await axios.post(
        cleanWpJsonUrl(`${WP_API_URL.replace('/wp-json','')}/wp-json/wc/v3/products/categories`),
        { name: fullCategoryName, slug: fullCategorySlug },
        { auth: { username: WC_ADMIN_KEY, password: WC_ADMIN_SECRET } }
      );
      res.status(200).json(createRes.data);
    } catch (err) {
      res.status(500).json({ error: '카테고리 생성 실패', detail: err.response?.data || err.message });
    }
    return;
  }

  // POST /api/save-menu
  if (req.method === 'POST' && req.query['save-menu'] !== undefined) {
    try {
      const { email, menus, categories } = req.body;
      if (!email) return res.status(400).json({ error: 'email이 필요합니다.' });
      const userRes = await axios.get(cleanWpJsonUrl(`${WP_API_URL}/custom/v1/user-by-email`), {
        params: { email },
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      const userId = userRes.data.ID;
      if (!userId) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      const meta = {};
      if (menus !== undefined) meta.menus = JSON.stringify(menus);
      if (categories !== undefined) meta.categories = JSON.stringify(categories);
      const updateRes = await axios.post(
        cleanWpJsonUrl(`${WP_API_URL}/wp/v2/users/${userId}`),
        { meta },
        { auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD } }
      );
      res.status(200).json({ message: '메뉴/카테고리 저장 성공', data: updateRes.data });
    } catch (err) {
      res.status(500).json({ error: err.response?.data || err.message });
    }
    return;
  }

  res.status(404).json({ error: 'Not found' });
} 