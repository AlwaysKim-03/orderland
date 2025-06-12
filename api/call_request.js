import axios from 'axios';

const WP_API_URL = process.env.WP_API_URL;
const WP_API_USERNAME = process.env.WP_API_USERNAME;
const WP_API_PASSWORD = process.env.WP_API_PASSWORD;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET /api/call_request
  if (req.method === 'GET') {
    try {
      const response = await axios.get(`${WP_API_URL.replace('/wp-json','')}/wp-json/wp/v2/call_request`, {
        params: req.query,
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