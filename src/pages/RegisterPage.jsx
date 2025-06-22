import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase"; // Firebase auth 및 db 객체 가져오기
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase 회원가입 함수
import { doc, setDoc } from "firebase/firestore"; // Firestore 데이터 저장 함수
import styles from '../styles/AuthForm.module.css';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !phone || !storeName || !email || !password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        phone: phone,
        store_name: storeName,
        tableCount: 0,
        createdAt: new Date()
      });
      
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 6자리 이상이어야 합니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>회원가입</h1>
        <form onSubmit={handleRegister}>
          {step === 1 && (
            <>
              <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                required
              />
              </div>
              <div className={styles.inputGroup}>
              <input
                type="tel"
                placeholder="전화번호"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={styles.input}
                required
              />
              </div>
              <button type="button" className={styles.button} onClick={() => {
                if (!name || !phone) {
                  setError('이름과 전화번호를 입력해주세요.');
                  return;
                }
                setError('');
                nextStep();
              }}>
                다음
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="가게 이름"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className={styles.input}
                required
              />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className={styles.button} style={{ flex: 1, background: '#e5e7eb', color: '#222' }} onClick={prevStep}>
                  이전
                </button>
                <button type="button" className={styles.button} style={{ flex: 1 }} onClick={() => {
                  if (!storeName) {
                    setError('가게 이름을 입력해주세요.');
                    return;
                  }
                  setError('');
                  nextStep();
                }}>
                  다음
                </button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
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
                  placeholder="비밀번호 (6자리 이상)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                required
              />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className={styles.button} style={{ flex: 1, background: '#e5e7eb', color: '#222' }} onClick={prevStep}>
                  이전
                </button>
                <button type="submit" className={styles.button} style={{ flex: 1 }}>
                  회원가입
                </button>
              </div>
            </>
          )}
          {error && <p className={styles.errorText}>{error}</p>}
        </form>
        <p className={styles.linkText}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}