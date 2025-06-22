<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('WP_CACHE', true);
define( 'WPCACHEHOME', '/happyfabric02/www/wp-content/plugins/wp-super-cache/' );
define( 'DB_NAME', 'happyfabric02' );

/** Database username */
define( 'DB_USER', 'happyfabric02' );

/** Database password */
define( 'DB_PASSWORD', 'Piggy031017' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          '$;_&E!2q0.7pif1[#!uL@=D-=kSxO1v%r&E}%hb|y+n<.-X=lfW{=x/54!^F,u)7' );
define( 'SECURE_AUTH_KEY',   'sT6sY<WmYJNhyP.:3_Btu,$hjf#&=B,[JlHI]NzIm:JnU-it]v~MjJH|vy)ms:b)' );
define( 'LOGGED_IN_KEY',     'J)<JH6O(iiR$GoBgxEetHR<5#y9.t{UUcnL_EJq::D3R%EN%<cs7[s{sm9P%AY=q' );
define( 'NONCE_KEY',         '@1kIq/qVzag,Zt6+JH9^e!D_37<FZ8|9=KrTZZhZ-&>~p[CISG!6JOeNU=M5Le|>' );
define( 'AUTH_SALT',         'g;ez6am$WIwVf<d_gmQpQf*E$-^:FeJ9rz>m}b{I9Pc^5^ih]VipYY2>-%*7FvS>' );
define( 'SECURE_AUTH_SALT',  'U$x4r/,Vu|u?t11&w-n4ww3Qu#ncH]>Mx;7^MD8p5~d`f3,UBF:Wr|),Eu$KQ=Cq' );
define( 'LOGGED_IN_SALT',    'HXhIO|(m5%)y-I=O&omp-3x$Z[a6=:k5ni3t*w,%~4]N9%GZ,}KCl-ZuCeIRG9f^' );
define( 'NONCE_SALT',        '6.rL-fBe-=`>T@4=#cRU?2[tD$fO%I5qEyzP-Qd_r!&vNl0}4h]|mdshW#so[% w' );
define( 'WP_CACHE_KEY_SALT', 'iJcMsR{S2 g=Lv&&~,slXa4VU(qlIwd7gHvHZ-wH@BzP;?TgE^8f74nOWMu;9&Db' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/* Add any custom values between this line and the "stop editing" line. */

// 사이트 기본 언어 설정
define( 'WPLANG', 'ko_KR' );

// ===== 실사용 환경 디버그 설정 =====
define( 'WP_DEBUG', false );           // 디버그 모드 비활성화
define( 'WP_DEBUG_LOG', true );        // 에러는 debug.log에만 기록
define( 'WP_DEBUG_DISPLAY', false );   // 화면에는 표시하지 않음
@ini_set( 'display_errors', 0 );       // PHP 에러 화면 표시 비활성화
@ini_set( 'log_errors', 1 );           // PHP 에러 로그 활성화

// ===== 보안 설정 =====
define('DISALLOW_FILE_EDIT', true);    // 테마/플러그인 편집 비활성화
define('IMAGE_EDIT_OVERWRITE', true);  // 이미지 편집 시 원본 덮어쓰기
define('EMPTY_TRASH_DAYS', 7);         // 휴지통 자동 비우기 (7일)

// ===== 추가 보안 설정 =====
define('FORCE_SSL_ADMIN', true);       // 관리자 페이지 SSL 강제
define('FORCE_SSL_LOGIN', true);       // 로그인 페이지 SSL 강제
define('WP_AUTO_UPDATE_CORE', true);   // 자동 업데이트 활성화

// ===== 성능 최적화 =====
define('WP_MEMORY_LIMIT', '256M');     // 메모리 제한 증가
define('WP_MAX_MEMORY_LIMIT', '512M'); // 관리자 페이지 메모리 제한
define('WP_POST_REVISIONS', 5);        // 포스트 리비전 제한

// ===== 파일 업로드 설정 =====
define('ALLOW_UNFILTERED_UPLOADS', false); // 필터링되지 않은 업로드 비활성화

// ===== JWT 인증 설정 =====
define('JWT_AUTH_SECRET_KEY', 'jwt-secret-2024!@#aBc');
define('JWT_AUTH_CORS_ENABLE', true);

// ===== REST API 설정 =====
define('REST_API_ALLOW_ANONYMOUS_COMMENTS', false); // 익명 댓글 비활성화

// ===== 캐시 설정 =====
define('WP_CACHE', true);
define('WPCACHEHOME', '/happyfabric02/www/wp-content/plugins/wp-super-cache/');

// ===== 파일 시스템 설정 =====
define('FS_METHOD', 'direct');         // 직접 파일 시스템 사용

// ===== 데이터베이스 최적화 =====
define('EMPTY_TRASH_DAYS', 7);         // 휴지통 자동 비우기
define('WP_POST_REVISIONS', 5);        // 포스트 리비전 제한

// ===== 외부 요청 제한 =====
define('WP_HTTP_BLOCK_EXTERNAL', false); // 외부 요청 허용 (필요시 true로 변경)

// ===== 개발자 도구 비활성화 =====
define('SCRIPT_DEBUG', false);         // 스크립트 디버그 비활성화
define('SAVEQUERIES', false);          // 쿼리 저장 비활성화

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php'; 