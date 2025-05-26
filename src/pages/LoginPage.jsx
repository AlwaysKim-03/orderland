import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import LoginForm from '../components/LoginForm';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async ({ username, password }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_SITE_URL}/wp-json/jwt-auth/v1/token`, {
        username,
        password,
      });

      const { token, user_nicename } = response.data;

      // 로그인 성공한 경우
      if (token) {
        Cookies.set('token', token, { expires: 1 });
        localStorage.setItem('token', token);
        localStorage.setItem('user_email', username);
        navigate('/dashboard');
      }

      alert(`${user_nicename}님, 로그인 성공!`);
      // 추후 관리자 페이지 등으로 이동
      // window.location.href = '/dashboard';

    } catch (error) {
      console.error('로그인 실패:', error.response?.data || error.message);
      alert('로그인 실패: 아이디 또는 비밀번호를 확인하세요.');
    }
  };

  return <LoginForm onSubmit={handleLogin} />;
}

export default LoginPage; 