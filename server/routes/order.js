const express = require('express');
const router = express.Router();
const axios = require('axios');

const WP_API_URL = process.env.WP_API_URL || 'http://localhost:8000/wp-json';
const WP_API_USERNAME = process.env.WP_API_USERNAME;
const WP_API_PASSWORD = process.env.WP_API_PASSWORD;

// 주문 생성
router.post('/', async (req, res) => {
  try {
    const { storeSlug, tableNumber, orders, totalAmount, status } = req.body;
    
    // orders 변환: quantity 필드 보장
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
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating order:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to create order'
    });
  }
});

// 가게별 주문 목록 조회
router.get('/store/:storeSlug', async (req, res) => {
  try {
    const response = await axios.get(`${WP_API_URL}/custom/v1/orders`, {
      params: { storeSlug: req.params.storeSlug },
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    // orders -> items로 변환
    const orders = Array.isArray(response.data) ? response.data.map(order => ({
      ...order,
      orders: Array.isArray(order.orders) 
        ? order.orders 
        : (typeof order.orders === 'string' ? JSON.parse(order.orders) : [])
    })) : [];
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to fetch orders'
    });
  }
});

// 주문 삭제
router.delete('/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${WP_API_URL}/custom/v1/order/${req.params.id}`, {
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting order:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to delete order'
    });
  }
});

// 주문 수정
router.post('/update-order', async (req, res) => {
  try {
    const { orderId, orders, totalAmount, tableNumber, storeSlug, status } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId가 필요합니다.' });

    // orders 변환: quantity 필드 보장
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
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating order:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to update order'
    });
  }
});

// 주문 삭제 (POST 방식, orderId로)
router.post('/delete-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId가 필요합니다.' });

    const response = await axios.delete(`${WP_API_URL}/custom/v1/order/${orderId}`, {
      auth: {
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting order:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to delete order'
    });
  }
});

module.exports = router; 