import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Firebase auth 객체 가져오기
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase 인증 함수 가져오기
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // 로그인 성공
      console.log("로그인 성공:", userCredential.user);
      localStorage.setItem("user_email", userCredential.user.email); // 이메일 저장
      
      // 로그인 성공 후 orderHistory_로 시작하는 localStorage 키 모두 삭제
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('orderHistory_')) {
          localStorage.removeItem(key);
        }
      });
      alert("로그인 성공");
      navigate("/dashboard");
    } catch (err) {
      console.error("Firebase 로그인 실패:", err);
      alert("로그인 실패: " + err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>로그인</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">로그인</button>
        </form>
        <p>
          아직 계정이 없으신가요?{" "}
          <a href="/register" style={{ color: "#2e6ff2" }}>
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;