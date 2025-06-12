import axios from 'axios';

const WP_API_URL = process.env.WP_API_URL;
const WP_API_USERNAME = process.env.WP_API_USERNAME;
const WP_API_PASSWORD = process.env.WP_API_PASSWORD;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST /api/custom/v1/call (직원 호출 생성)
  if (req.method === 'POST') {
    try {
      const response = await axios.post(`${WP_API_URL.replace('/wp-json','')}/wp-json/custom/v1/call`, req.body, {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      res.status(200).json(response.data);
    } catch (err) {
      res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
    }
    return;
  }

  // DELETE /api/custom/v1/call/:id (직원 호출 삭제)
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id가 필요합니다.' });
    try {
      const response = await axios.delete(`${WP_API_URL.replace('/wp-json','')}/wp-json/custom/v1/call/${id}`, {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      res.status(200).json(response.data);
    } catch (err) {
      res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
} 