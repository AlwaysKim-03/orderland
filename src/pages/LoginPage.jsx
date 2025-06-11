import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/wordpress";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser({ email, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user_email", email);
      // 로그인 성공 후 orderHistory_로 시작하는 localStorage 키 모두 삭제
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('orderHistory_')) {
          localStorage.removeItem(key);
        }
      });
      alert("로그인 성공");
      navigate("/dashboard");
    } catch (err) {
      alert("로그인 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>로그인</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="이메일 또는 아이디"
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