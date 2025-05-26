import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import AuthForm from '../components/AuthForm';

function RegisterPage() {
  const handleRegister = async (formData) => {
    try {
      console.log('🟡 [1] 회원가입 요청 시작');

      await axios.post('http://localhost:5001/api/register', {
        username: formData.username,
        email: formData.username,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        restaurantName: formData.restaurantName,
        location: formData.restaurantLocation,
      });

      console.log('✅ [1] 회원가입 성공');

      console.log('🟡 [2] 로그인 요청 시작');
      const loginRes = await axios.post(`${import.meta.env.VITE_SITE_URL}/wp-json/jwt-auth/v1/token`, {
        username: formData.username,
        password: formData.password,
      });

      const { token, user_nicename } = loginRes.data;
      console.log('✅ [2] 로그인 성공:', user_nicename);

      Cookies.set('token', token, { expires: 1 });
      console.log('✅ [3] 쿠키 저장 완료');

      alert(`${user_nicename}님, 회원가입 및 로그인 성공!`);
      window.location.href = '/dashboard';

    } catch (error) {
      console.error('❌ [에러 발생] 회원가입 또는 로그인 실패:', error.response?.data || error.message);
      console.error('에러 상태코드:', error.response?.status);
      console.error('에러 메시지:', error.response?.data);

      if (error.response?.data) {
        alert(`회원가입 실패: ${error.response.data.message || '알 수 없는 오류'}`);
      } else {
        alert('회원가입 또는 로그인에 실패했습니다. 관리자 인증 또는 아이디 중복을 확인해주세요.');
      }
    }
  };

  return <AuthForm onSubmit={handleRegister} />;
}

export default RegisterPage; 