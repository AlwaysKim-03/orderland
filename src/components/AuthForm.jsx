import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthForm({ onSubmit }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    restaurantName: '',
    restaurantLocation: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.phone)) {
      alert('이름, 전화번호를 모두 입력해주세요.');
      return;
    }
    if (step === 2 && (!formData.restaurantName || !formData.restaurantLocation)) {
      alert('식당 이름과 위치를 입력해주세요.');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    onSubmit(formData);
  };

  const goToLogin = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f6f7' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', minWidth: '320px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>회원가입</h2>

        {step === 1 && (
          <>
            <input type="text" name="name" placeholder="이름" value={formData.name} onChange={handleChange} style={inputStyleDefault} required />
            <input type="text" name="phone" placeholder="전화번호" value={formData.phone} onChange={handleChange} style={inputStyleDefault} required />
            <button type="button" onClick={handleNext} style={buttonStyle}>다음</button>
          </>
        )}

        {step === 2 && (
          <>
            <input type="text" name="restaurantName" placeholder="식당 이름" value={formData.restaurantName} onChange={handleChange} style={inputStyleDefault} required />
            <input type="text" name="restaurantLocation" placeholder="식당 위치" value={formData.restaurantLocation} onChange={handleChange} style={inputStyleDefault} required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={handleBack} style={backButtonStyle}>뒤로가기</button>
              <button type="button" onClick={handleNext} style={buttonStyle}>다음</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <input type="text" name="username" placeholder="아이디" value={formData.username} onChange={handleChange} style={inputStyleDefault} required />
            <input type="password" name="password" placeholder="비밀번호" value={formData.password} onChange={handleChange} style={inputStyleDefault} required />
            <input type="password" name="confirmPassword" placeholder="비밀번호 확인" value={formData.confirmPassword} onChange={handleChange} style={inputStyleDefault} required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={handleBack} style={backButtonStyle}>뒤로가기</button>
              <button type="submit" style={buttonStyle}>회원가입</button>
            </div>
          </>
        )}
      </form>
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
        <span style={{ color: '#3b82f6' }}>이미 계정이 있으신가요? </span>
        <a
          href="/login"
          onClick={goToLogin}
          style={{ color: '#3b82f6', textDecoration: 'underline' }}
        >
          로그인
        </a>
      </div>
    </div>
  );
}

const inputStyleDefault = {
  width: '100%',
  padding: '12px',
  marginBottom: '12px',
  fontSize: '14px',
  borderRadius: '4px',
  border: '1px solid #000',
  background: '#fff',
  color: '#222',
  boxSizing: 'border-box'
};

const buttonStyle = {
  width: '100%',
  backgroundColor: '#3b82f6',
  color: '#fff',
  padding: '12px',
  fontSize: '16px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  marginTop: '8px',
};

const backButtonStyle = {
  width: '100%',
  backgroundColor: '#e5e7eb',
  color: '#222',
  padding: '12px',
  fontSize: '16px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  marginTop: '8px',
};

export default AuthForm; 