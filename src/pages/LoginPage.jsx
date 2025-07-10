import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase"; // Firebase auth 객체 가져오기
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"; // Firebase 인증 함수 가져오기
import styles from "../styles/AuthForm.module.css";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [showFindAccount, setShowFindAccount] = useState(false);
  const [findName, setFindName] = useState("");
  const [findPhone, setFindPhone] = useState("");
  const [findResult, setFindResult] = useState("");
  const [findError, setFindError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMsg("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMsg("비밀번호 재설정 메일이 전송되었습니다. 메일함을 확인하세요.");
    } catch (err) {
      setResetMsg("재설정 메일 전송 실패: " + (err.message || err.code));
    }
  };

  function toInternationalPhone(value) {
    const onlyNums = value.replace(/\D/g, '');
    if (onlyNums.startsWith('010')) {
      return '+82' + onlyNums.slice(1);
    }
    return value;
  }

  async function handleFindAccount(e) {
    e.preventDefault();
    setFindResult("");
    setFindError("");
    try {
      console.log('[계정찾기] 입력 이름:', findName);
      console.log('[계정찾기] 입력 전화번호:', findPhone);
      const intlPhone = toInternationalPhone(findPhone);
      console.log('[계정찾기] 변환된 국제번호:', intlPhone);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("name", "==", findName), where("phone", "==", intlPhone));
      console.log('[계정찾기] Firestore 쿼리 실행');
      const snapshot = await getDocs(q);
      console.log('[계정찾기] 쿼리 결과 개수:', snapshot.size);
      if (snapshot.empty) {
        setFindError("일치하는 계정이 없습니다.");
        console.log('[계정찾기] 결과 없음');
      } else {
        const user = snapshot.docs[0].data();
        // 이메일 전체 표시 (마스킹 제거)
        setFindResult(user.email);
        console.log('[계정찾기] 결과 이메일:', user.email);
      }
    } catch (err) {
      setFindError("계정 찾기 중 오류가 발생했습니다.");
      console.error('[계정찾기] 에러:', err);
    }
  }

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
          {/*
          <button
            type="button"
            className={styles.button}
            style={{ background: '#10b981', marginTop: 8 }}
            onClick={async () => {
              try {
                console.log('=== Passkey 로그인 시작 ===');
                console.log('1. Firebase auth import 시도...');
                const { signInWithPasskey } = await import('firebase/auth');
                console.log('2. signInWithPasskey import 성공:', !!signInWithPasskey);
                
                console.log('3. signInWithPasskey 호출 시도...');
                const result = await signInWithPasskey(auth);
                console.log('4. signInWithPasskey 성공:', result);
                
                navigate('/');
              } catch (e) {
                console.error('=== Passkey 로그인 실패 ===');
                console.error('에러 코드:', e.code);
                console.error('에러 메시지:', e.message);
                console.error('전체 에러 객체:', e);
                
                let errorMessage = 'Passkey(지문/Face ID) 로그인에 실패했습니다.';
                if (e.code === 'auth/not-supported') {
                  errorMessage = '이 브라우저/기기는 Passkey를 지원하지 않습니다.';
                } else if (e.code === 'auth/no-credential') {
                  errorMessage = '등록된 Passkey가 없습니다.';
                } else if (e.code === 'auth/operation-not-allowed') {
                  errorMessage = 'Passkey 기능이 활성화되지 않았습니다.';
                } else if (e.message?.includes('not supported')) {
                  errorMessage = '이 기기에서 생체인식을 지원하지 않습니다.';
                }
                
                alert(errorMessage + '\n\n브라우저/기기 지원 여부를 확인하세요.');
              }
            }}
          >
            Passkey(지문/Face ID)로 로그인
          </button>
          */}
          {error && <p className={styles.errorText}>{error}</p>}
        </form>
        <p className={styles.linkText}>
          아직 계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button type="button" style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', marginRight: 8 }} onClick={() => setShowReset(true)}>
            비밀번호 찾기
          </button>
          <button type="button" style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setShowFindAccount(true)}>계정(이메일) 찾기</button>
        </div>
        {showReset && (
          <div style={{ marginTop: 20, padding: 16, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
            <h4 style={{ margin: 0, marginBottom: 8 }}>비밀번호 재설정</h4>
            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                placeholder="가입한 이메일 입력"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className={styles.input}
                style={{ marginBottom: 8, width: '100%' }}
                required
              />
              <button type="submit" className={styles.button} style={{ width: '100%' }}>재설정 메일 보내기</button>
            </form>
            {resetMsg && <div style={{ color: resetMsg.startsWith('비밀번호') ? 'green' : 'red', marginTop: 8 }}>{resetMsg}</div>}
            <button type="button" style={{ marginTop: 8, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }} onClick={() => setShowReset(false)}>닫기</button>
          </div>
        )}
        {showFindAccount && (
          <div style={{ marginTop: 20, padding: 16, border: '1px solid #eee', borderRadius: 8, background: '#fafafa', position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <h4 style={{ margin: 0, marginBottom: 8 }}>계정(이메일) 찾기</h4>
              <form onSubmit={handleFindAccount}>
                <input
                  type="text"
                  placeholder="이름"
                  value={findName}
                  onChange={e => setFindName(e.target.value)}
                  className={styles.input}
                  style={{ marginBottom: 8, width: '100%' }}
                  required
                />
                <input
                  type="text"
                  placeholder="전화번호"
                  value={findPhone}
                  onChange={e => setFindPhone(e.target.value)}
                  className={styles.input}
                  style={{ marginBottom: 8, width: '100%' }}
                  required
                />
                <button type="submit" className={styles.button} style={{ width: '100%' }}>계정 찾기</button>
              </form>
              {findResult && <div style={{ color: 'green', marginTop: 12 }}>가입된 이메일: {findResult}</div>}
              {findError && <div style={{ color: 'red', marginTop: 12 }}>{findError}</div>}
              <button type="button" style={{ marginTop: 12, background: 'none', border: 'none', color: '#888', cursor: 'pointer', width: '100%' }} onClick={() => setShowFindAccount(false)}>닫기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}