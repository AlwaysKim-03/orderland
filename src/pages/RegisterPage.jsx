import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Firebase auth 및 db 객체 가져오기
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase 회원가입 함수
import { doc, setDoc } from "firebase/firestore"; // Firestore 데이터 저장 함수
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
      // 1. Firebase Authentication으로 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Firestore에 추가 정보 저장
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        phone: formData.phone,
        store_name: formData.store_name,
        store_address: formData.store_address,
        email: formData.email,
      });

      // 회원가입 성공 후 처리
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('orderHistory_')) {
          localStorage.removeItem(key);
        }
      });
      // 가게명 동기화 (필요하다면 유지, 하지만 Firestore에서 관리하는 것이 더 좋음)
      localStorage.setItem('restaurantName', formData.store_name);
      localStorage.setItem('storeName', formData.store_name);
      localStorage.setItem('storeInfo', JSON.stringify({ storeName: formData.store_name }));
      
      alert("회원가입 성공!");
      navigate("/login");
    } catch (err) {
      console.error("Firebase 회원가입 실패:", err);
      alert("회원가입 실패: " + err.message);
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