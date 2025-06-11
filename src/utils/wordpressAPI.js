import axios from "axios";

// 워드프레스 관리자 인증 토큰 (Base64 인코딩)
const wpToken = btoa(`${import.meta.env.VITE_WP_ADMIN_USER}:${import.meta.env.VITE_WP_APP_PASSWORD}`);
// 또는 .env에 직접 인코딩된 값이 있다면 아래처럼 사용하세요:
// const wpToken = import.meta.env.VITE_WP_AUTH_TOKEN;

export async function registerStoreOwner({ siteURL, username, email, password, storeName }) {
  try {
    // axios.post 호출 전에 데이터 출력
    console.log("📦 회원가입 데이터 전송 준비:", {
      username,
      email,
      password,
      storeName,
      siteURL,
    });
    const response = await axios.post(
      `${siteURL}/wp-json/wp/v2/users`,
      {
        username,
        email,
        password,
        roles: "editor",
        meta: {
          store_name_kr: storeName,
        },
      },
      {
        headers: {
          Authorization: `Basic ${wpToken}`,
          // Authorization: import.meta.env.VITE_WP_AUTH_TOKEN, // .env에 인코딩된 토큰이 있다면 이 줄을 사용
          "Content-Type": "application/json",
        },
      }
    );
    // 요청 성공 시 출력
    console.log("✅ 워드프레스 회원가입 성공 응답:", response.data);
    return response.data;
  } catch (error) {
    // 요청 실패 시 출력
    console.error("❌ 회원가입 요청 실패 상세:", error.response?.data || error.message);
    throw error;
  }
} 