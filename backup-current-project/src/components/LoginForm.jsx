import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginForm({ onSubmit }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const goToRegister = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f6f7' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', minWidth: '320px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>로그인</h2>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="아이디"
          style={{ width: '100%', padding: '12px', marginBottom: '12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #000', background: '#fff', color: '#222', boxSizing: 'border-box' }}
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="비밀번호"
          style={{ width: '100%', padding: '12px', marginBottom: '20px', fontSize: '14px', borderRadius: '4px', border: '1px solid #000', background: '#fff', color: '#222', boxSizing: 'border-box' }}
          required
        />
        <button
          type="submit"
          style={{ width: '100%', backgroundColor: '#3b82f6', color: '#fff', padding: '12px', fontSize: '16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
        >
          로그인
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
        <span style={{ color: '#3b82f6' }}>아직 계정이 없으신가요? </span>
        <a
          href="/register"
          onClick={goToRegister}
          style={{ color: '#3b82f6', textDecoration: 'underline' }}
        >
          회원가입
        </a>
      </div>
    </div>
  );
}

export default LoginForm; 