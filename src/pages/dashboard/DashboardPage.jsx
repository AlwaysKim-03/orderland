const fetchOrders = async () => {
  const storeSlug = toSlug(localStorage.getItem('restaurantName'));
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/custom/v1/orders?storeSlug=${storeSlug}`,
      {
        headers: {
          Authorization: `Basic ${btoa(import.meta.env.VITE_WP_ADMIN_USER + ':' + import.meta.env.VITE_WP_APP_PASSWORD)}`
        }
      }
    );
    setOrders(res.data);
  } catch (err) {
    console.error('주문 목록 조회 실패:', err.response?.data || err.message);
    setOrders([]);
  }
};

const handleDeleteOrder = async (orderId) => {
  if (!window.confirm('이 주문을 삭제하시겠습니까?')) return;
  
  try {
    await axios.delete(
      `${import.meta.env.VITE_API_URL}/custom/v1/order/${orderId}`,
      {
        headers: {
          Authorization: `Basic ${btoa(import.meta.env.VITE_WP_ADMIN_USER + ':' + import.meta.env.VITE_WP_APP_PASSWORD)}`
        }
      }
    );
    fetchOrders();
    alert('주문이 삭제되었습니다.');
  } catch (err) {
    console.error('주문 삭제 실패:', err.response?.data || err.message);
    alert('주문 삭제에 실패했습니다.');
  }
}; 