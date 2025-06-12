import axios from 'axios';

const WP_API_URL = process.env.WP_API_URL;
const WP_API_USERNAME = process.env.WP_API_USERNAME;
const WP_API_PASSWORD = process.env.WP_API_PASSWORD;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST /api/orders (주문 생성)
  if (req.method === 'POST' && !req.query.updateOrder && !req.query.deleteOrder) {
    try {
      const { storeSlug, tableNumber, orders, totalAmount, status } = req.body;
      const normalizedOrders = (orders || []).map(item => ({
        ...item,
        quantity: item.quantity !== undefined ? Number(item.quantity) : (item.count !== undefined ? Number(item.count) : 1)
      }));
      const payload = {
        storeSlug,
        tableNumber,
        orders: normalizedOrders,
        totalAmount: Number(totalAmount),
        status: status || '신규'
      };
      const response = await axios.post(`${WP_API_URL}/custom/v1/order`, payload, {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      res.status(200).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to create order' });
    }
    return;
  }

  // GET /api/orders/store/:storeSlug (가게별 주문 목록 조회)
  if (req.method === 'GET' && req.query.store) {
    try {
      const storeSlug = req.query.store;
      const response = await axios.get(`${WP_API_URL}/custom/v1/orders`, {
        params: { storeSlug },
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      const orders = Array.isArray(response.data) ? response.data.map(order => ({
        ...order,
        orders: Array.isArray(order.orders)
          ? order.orders
          : (typeof order.orders === 'string' ? JSON.parse(order.orders) : [])
      })) : [];
      res.status(200).json(orders);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to fetch orders' });
    }
    return;
  }

  // DELETE /api/orders/:id (주문 삭제)
  if (req.method === 'DELETE' && req.query.id) {
    try {
      const response = await axios.delete(`${WP_API_URL}/custom/v1/order/${req.query.id}`, {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      res.status(200).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to delete order' });
    }
    return;
  }

  // POST /api/orders/update-order (주문 수정)
  if (req.method === 'POST' && req.query.updateOrder) {
    try {
      const { orderId, orders, totalAmount, tableNumber, storeSlug, status } = req.body;
      if (!orderId) return res.status(400).json({ error: 'orderId가 필요합니다.' });
      const normalizedOrders = (orders || []).map(item => ({
        ...item,
        quantity: item.quantity !== undefined ? Number(item.quantity) : (item.count !== undefined ? Number(item.count) : 1)
      }));
      const payload = {
        orders: normalizedOrders,
        totalAmount: Number(totalAmount),
        tableNumber,
        storeSlug,
        status: status || '진행중'
      };
      const response = await axios.put(`${WP_API_URL}/custom/v1/order/${orderId}`, payload, {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      res.status(200).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to update order' });
    }
    return;
  }

  // POST /api/orders/delete-order (주문 삭제, POST)
  if (req.method === 'POST' && req.query.deleteOrder) {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ error: 'orderId가 필요합니다.' });
      const response = await axios.delete(`${WP_API_URL}/custom/v1/order/${orderId}`, {
        auth: { username: WP_API_USERNAME, password: WP_API_PASSWORD }
      });
      res.status(200).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Failed to delete order' });
    }
    return;
  }

  res.status(404).json({ error: 'Not found' });
} 