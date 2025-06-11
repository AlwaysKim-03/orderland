import axios from 'axios';

console.log("✅ .env 확인 - SITE_URL:", import.meta.env.VITE_SITE_URL);
console.log("✅ .env 확인 - WC_ADMIN_KEY:", import.meta.env.VITE_WC_ADMIN_KEY);

const baseURL = import.meta.env.VITE_SITE_URL;
const consumerKey = import.meta.env.VITE_WC_PUBLIC_KEY;
const consumerSecret = import.meta.env.VITE_WC_PUBLIC_SECRET;

const WooAPI = axios.create({
  baseURL: `${baseURL}/wp-json/wc/v3`,
  auth: {
    username: consumerKey,
    password: consumerSecret
  }
});

export const fetchCategoriesByAccount = async (accountId) => {
  const res = await WooAPI.get('/products/categories');
  return res.data.filter(cat => cat.name.startsWith(`${accountId}_`));
};

export const fetchProductsByCategory = async (categoryId) => {
  const res = await WooAPI.get('/products', {
    params: { category: categoryId }
  });
  return res.data;
}; 