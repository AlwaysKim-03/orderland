import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase"; // Firebase auth 객체 가져오기
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase 인증 함수 가져오기
import styles from "../styles/AuthForm.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>로그인</h1>
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
          <input
              type="email"
              placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            required
          />
          </div>
          <div className={styles.inputGroup}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            required
          />
          </div>
          <button type="submit" className={styles.button}>
            로그인
          </button>
          {error && <p className={styles.errorText}>{error}</p>}
        </form>
        <p className={styles.linkText}>
          아직 계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  );
}