function save_order_data($request) {
  $storeSlug = sanitize_text_field($request['storeSlug']);
  $tableNumber = sanitize_text_field($request['tableNumber']);
  $orders = $request['orders'];
  $totalAmount = floatval($request['totalAmount']);
  $status = sanitize_text_field($request['status'] ?? '신규');

  if (!$storeSlug || !$tableNumber || !is_array($orders)) {
    return new WP_Error('invalid_data', '필수 데이터가 누락되었습니다.', ['status' => 400]);
  }

  // 각 메뉴의 quantity 필드가 없으면 1로 보정
  foreach ($orders as &$item) {
    if (!isset($item['quantity'])) {
      if (isset($item['count'])) {
        $item['quantity'] = intval($item['count']);
      } else {
        $item['quantity'] = 1;
      }
    } else {
      $item['quantity'] = intval($item['quantity']);
    }
  }
  unset($item);

  $order_title = "{$storeSlug} - Table {$tableNumber}";
  $post_id = wp_insert_post([
    'post_type' => 'order',
    'post_title' => $order_title,
    'post_status' => 'publish',
  ]);

  if (is_wp_error($post_id)) {
    return new WP_Error('insert_failed', '주문 저장에 실패했습니다.', ['status' => 500]);
  }

  update_post_meta($post_id, 'storeSlug', $storeSlug);
  update_post_meta($post_id, 'tableNumber', $tableNumber);
  update_post_meta($post_id, 'status', $status);
  update_post_meta($post_id, 'totalAmount', $totalAmount);
  // orders를 항상 JSON 문자열로 저장
  update_post_meta($post_id, 'orders', wp_json_encode($orders));

  return ['success' => true, 'order_id' => $post_id];
} 