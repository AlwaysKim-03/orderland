import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/wordpress";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    store_name: "",
    store_address: "",
    email: "",
    password: "",
    confirmPassword: "",
    store_phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      await registerUser({ ...formData });
      // 회원가입 성공 후 orderHistory_로 시작하는 localStorage 키 모두 삭제
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('orderHistory_')) {
          localStorage.removeItem(key);
        }
      });
      // 가게명 동기화 (원본 그대로 저장)
      localStorage.setItem('restaurantName', formData.store_name);
      localStorage.setItem('storeName', formData.store_name);
      localStorage.setItem('storeInfo', JSON.stringify({ storeName: formData.store_name }));
      alert("회원가입 성공");
      navigate("/login");
    } catch (err) {
      alert("회원가입 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>회원가입</h2>
        <form onSubmit={handleRegister}>
          {step === 1 && (
            <>
              <input
                type="text"
                name="name"
                placeholder="이름"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="전화번호"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <div className="step-buttons">
                <button type="button" onClick={nextStep}>다음</button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <input
                type="text"
                name="store_name"
                placeholder="가게 이름"
                value={formData.store_name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="store_address"
                placeholder="가게 주소"
                value={formData.store_address}
                onChange={handleChange}
                required
              />
              <div className="step-buttons">
                <button type="button" onClick={prevStep}>이전</button>
                <button type="button" onClick={nextStep}>다음</button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <input
                type="text"
                name="email"
                placeholder="이메일"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <div className="step-buttons">
                <button type="button" onClick={prevStep}>이전</button>
                <button type="submit">회원가입</button>
              </div>
            </>
          )}
        </form>
        <p className="login-link">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage; 