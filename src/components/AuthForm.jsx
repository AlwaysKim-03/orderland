import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthForm({ onSubmit, mode = 'register' }) {
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
    if (mode === 'login') {
      if (!formData.username || !formData.password) {
        alert('계정과 비밀번호를 모두 입력해주세요.');
        return;
      }
      onSubmit({ username: formData.username, password: formData.password });
      return;
    }
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

  const goToRegister = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  if (mode === 'login') {
    return (
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '80px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001', padding: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="계정"
            style={{ width: '100%', padding: 12, marginBottom: 12, fontSize: 16 }}
          />
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호"
            style={{ width: '100%', padding: 12, fontSize: 16 }}
          />
        </div>
        <button type="submit" style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 18, cursor: 'pointer' }}>
          로그인
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span>아직 계정이 없으신가요? </span>
          <button
            type="button"
            style={{ background: 'none', color: '#1976d2', border: 'none', fontSize: 16, cursor: 'pointer', textDecoration: 'underline', marginLeft: 4 }}
            onClick={goToRegister}
          >
            회원가입
          </button>
        </div>
      </form>
    );
  }

  // 기존 회원가입 폼 렌더링 (mode !== 'login')
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '80px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001', padding: 32 }}>
      {step === 1 && (
        <>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="이름" style={{ width: '100%', padding: 12, marginBottom: 12, fontSize: 16 }} />
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="전화번호" style={{ width: '100%', padding: 12, fontSize: 16 }} />
        </>
      )}
      {step === 2 && (
        <>
          <input name="restaurantName" value={formData.restaurantName} onChange={handleChange} placeholder="식당 이름" style={{ width: '100%', padding: 12, marginBottom: 12, fontSize: 16 }} />
          <input name="restaurantLocation" value={formData.restaurantLocation} onChange={handleChange} placeholder="식당 위치" style={{ width: '100%', padding: 12, fontSize: 16 }} />
        </>
      )}
      {step === 3 && (
        <>
          <input name="username" value={formData.username} onChange={handleChange} placeholder="계정(이메일)" style={{ width: '100%', padding: 12, marginBottom: 12, fontSize: 16 }} />
          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="비밀번호" style={{ width: '100%', padding: 12, marginBottom: 12, fontSize: 16 }} />
          <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="비밀번호 확인" style={{ width: '100%', padding: 12, fontSize: 16 }} />
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        {step > 1 && <button type="button" onClick={handleBack} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 16, cursor: 'pointer' }}>이전</button>}
        {step < 3 && <button type="button" onClick={handleNext} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 16, cursor: 'pointer', marginLeft: 'auto' }}>다음</button>}
        {step === 3 && <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 16, cursor: 'pointer', marginLeft: 'auto' }}>회원가입</button>}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <span>이미 계정이 있으신가요? </span>
        <button
          type="button"
          style={{ background: 'none', color: '#1976d2', border: 'none', fontSize: 16, cursor: 'pointer', textDecoration: 'underline', marginLeft: 4 }}
          onClick={goToLogin}
        >
          로그인
        </button>
      </div>
    </form>
  );
}

export default AuthForm; 