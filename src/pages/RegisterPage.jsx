import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import styles from '../styles/AuthForm.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

if (import.meta.env.DEV) {
  console.log("RecaptchaVerifier import 결과:", RecaptchaVerifier);
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneAuthError, setPhoneAuthError] = useState("");
  const [phoneAuthSuccess, setPhoneAuthSuccess] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined" || !auth) return;
    const checkAndCreateRecaptcha = () => {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (import.meta.env.DEV) {
        console.log("auth 인스턴스:", auth);
        console.log("recaptcha-container DOM:", recaptchaContainer);
      }
      if (recaptchaContainer && !window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          { size: 'invisible' }
        );
        if (import.meta.env.DEV) {
          console.log("recaptchaVerifier 생성됨:", window.recaptchaVerifier);
        }
      } else if (!recaptchaContainer) {
        setTimeout(checkAndCreateRecaptcha, 50);
      }
    };
    checkAndCreateRecaptcha();
    return () => {
      if (window.recaptchaVerifier && typeof window.recaptchaVerifier.clear === 'function') {
        window.recaptchaVerifier.clear();
      }
      window.recaptchaVerifier = null;
    };
  }, [auth]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 전화번호 하이픈 자동 추가 함수
  const formatPhoneNumber = (value) => {
    const onlyNums = value.replace(/\D/g, '');
    if (onlyNums.length < 4) return onlyNums;
    if (onlyNums.length < 8) return onlyNums.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    return onlyNums.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
  };

  // Firebase용 국제전화번호 변환 함수
  const toInternationalPhone = (value) => {
    const onlyNums = value.replace(/\D/g, '');
    if (onlyNums.startsWith('010')) {
      return '+82' + onlyNums.slice(1);
    }
    // 이미 국제번호 등 그 외는 그대로 반환
    return value;
  };

  const sendCode = async () => {
    if (cooldown > 0) return;
    setPhoneAuthError("");
    setPhoneAuthSuccess("");
    try {
      const appVerifier = window.recaptchaVerifier;
      const intlPhone = toInternationalPhone(phone);
      // Firebase signInWithPhoneNumber은 메시지 커스터마이즈 불가. 실제 문자 발송 커스터마이즈가 필요하다면 외부 SMS API 연동 필요.
      // 아래는 예시로, 만약 직접 문자 발송 API를 쓴다면:
      // const code = ...; // 인증번호 생성
      // const smsMessage = `[store owner web] 인증번호는 [${code}]입니다.\n타인에게 공유하지 마세요.`;
      // await sendCustomSMS(intlPhone, smsMessage);
      // 하지만 Firebase Auth는 메시지 커스터마이즈 불가. 안내 주석만 추가.
      const confirmationResult = await signInWithPhoneNumber(auth, intlPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      setPhoneAuthSuccess("인증번호 전송 성공");
      setPhoneAuthError("");
      setCooldown(30); // 30초 쿨타임 시작
    } catch (err) {
      setPhoneAuthError("인증번호 전송 실패: " + err.message);
      setPhoneAuthSuccess("");
    }
  };

  const verifyCode = async () => {
    setPhoneAuthError("");
    setPhoneAuthSuccess("");
    try {
      const confirmationResult = window.confirmationResult;
      const result = await confirmationResult.confirm(otp);
      setPhoneAuthSuccess("인증 성공!");
      setPhoneAuthError("");
      setPhoneVerified(true);
      // 전화번호 연동: 이미 이메일/비밀번호로 회원가입된 상태라면, 전화번호를 계정에 연동
      if (auth.currentUser) {
        // OTP 인증 결과에서 verificationId, code 추출
        const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
        try {
          await linkWithCredential(auth.currentUser, credential);
          setPhoneAuthSuccess("전화번호가 계정에 연동되었습니다!");
        } catch (e) {
          setPhoneAuthError("전화번호 연동 실패: " + (e.message || e.code));
        }
      }
    } catch (err) {
      setPhoneAuthError("인증 실패: " + err.message);
      setPhoneAuthSuccess("");
    }
  };

  // 단계별 다음 버튼 핸들러
  const handleNextStep1 = () => {
    setError("");
    if (!phoneVerified) {
      setError('전화번호 인증을 완료해주세요.');
      return;
    }
    if (!name) {
      setError('이름을 입력해주세요.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setError("");
    if (!storeName) {
      setError('가게 이름을 입력해주세요.');
      return;
    }
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }
    setStep(3);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!password || !confirmPassword) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        store_name: storeName,
        phone: toInternationalPhone(phone),
        tableCount: 1,
        createdAt: new Date()
      });
      setStep(4);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 6자리 이상이어야 합니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>회원가입</h1>
        {step === 1 && (
          <div style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
            <h3>1단계: 전화번호 인증 및 이름 입력</h3>
            <div style={{ position: 'relative', marginBottom: 16, width: '100%' }}>
              <input
                value={phone}
                onChange={e => setPhone(formatPhoneNumber(e.target.value))}
                placeholder="전화번호"
                className={styles.input}
                style={{ paddingRight: 44, width: '100%', boxSizing: 'border-box' }}
                disabled={phoneVerified}
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={phoneVerified || cooldown > 0}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#1a1a1a',
                  fontSize: 15,
                  padding: 0,
                  height: 'auto',
                  minWidth: 'auto',
                  cursor: phoneVerified || cooldown > 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                {cooldown > 0 ? `${cooldown}초` : '확인'}
              </button>
            </div>
            {otpSent && !phoneVerified && (
              <>
                <input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="인증번호"
                  className={styles.input}
                  style={{ marginBottom: 8, width: '100%', boxSizing: 'border-box' }}
                />
                <button type="button" className={styles.button} style={{ marginBottom: 8, width: '100%' }} onClick={verifyCode}>
                  인증 확인
                </button>
              </>
            )}
            <div id="recaptcha-container"></div>
            {phoneAuthError && !phoneAuthSuccess && <div style={{ color: "red" }}>{phoneAuthError}</div>}
            {phoneAuthSuccess && <div style={{ color: "green" }}>{phoneAuthSuccess}</div>}
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              style={{ marginTop: 8, marginBottom: 16, width: '100%', boxSizing: 'border-box' }}
            />
            <button type="button" className={styles.button} onClick={handleNextStep1} style={{ width: '100%' }}>
              다음
            </button>
            {error && <p className={styles.errorText}>{error}</p>}
          </div>
        )}
        {step === 2 && (
          <div style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
            <h3>2단계: 가게 이름 및 이메일 입력</h3>
            <input
              type="text"
              placeholder="가게 이름"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className={styles.input}
              style={{ marginBottom: 8 }}
            />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              style={{ marginBottom: 8 }}
            />
            <button type="button" className={styles.button} onClick={handleNextStep2} style={{ width: '100%' }}>
              다음
            </button>
            {error && <p className={styles.errorText}>{error}</p>}
          </div>
        )}
        {step === 3 && (
          <form onSubmit={handleRegister} style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
            <h3>3단계: 비밀번호 입력</h3>
            <div className={styles.inputGroup} style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호 (6자리 이상)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className={styles.inputGroup} style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button type="submit" className={styles.button} style={{ width: '100%' }}>
              회원가입
            </button>
            {error && <p className={styles.errorText}>{error}</p>}
          </form>
        )}
        {step === 4 && (
          <div style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8, textAlign: 'center' }}>
            <h3>회원가입이 완료되었습니다!</h3>
            {/*
            <p>지문/Face ID 등 Passkey(패스키)로 로그인하시겠습니까?</p>
            <button
              type="button"
              className={styles.button}
              style={{ width: '100%', marginBottom: 16 }}
              onClick={async () => {
                try {
                  console.log('=== Passkey 등록 시작 ===');
                  console.log('1. Firebase auth import 시도...');
                  const { linkWithPasskey } = await import('firebase/auth');
                  console.log('2. linkWithPasskey import 성공:', !!linkWithPasskey);
                  
                  console.log('3. 현재 사용자 확인:', auth.currentUser?.uid);
                  if (!auth.currentUser) {
                    throw new Error('사용자가 로그인되지 않았습니다.');
                  }
                  
                  console.log('4. linkWithPasskey 호출 시도...');
                  const result = await linkWithPasskey(auth.currentUser);
                  console.log('5. linkWithPasskey 성공:', result);
                  
                  alert('Passkey(지문/Face ID) 등록이 완료되었습니다!');
                  window.location.href = '/';
                } catch (e) {
                  console.error('=== Passkey 등록 실패 ===');
                  console.error('에러 코드:', e.code);
                  console.error('에러 메시지:', e.message);
                  console.error('전체 에러 객체:', e);
                  
                  let errorMessage = 'Passkey 등록에 실패했습니다.';
                  if (e.code === 'auth/not-supported') {
                    errorMessage = '이 브라우저/기기는 Passkey를 지원하지 않습니다.';
                  } else if (e.code === 'auth/credential-already-in-use') {
                    errorMessage = '이미 Passkey가 등록되어 있습니다.';
                  } else if (e.code === 'auth/operation-not-allowed') {
                    errorMessage = 'Passkey 기능이 활성화되지 않았습니다.';
                  } else if (e.message?.includes('not supported')) {
                    errorMessage = '이 기기에서 생체인식을 지원하지 않습니다.';
                  }
                  
                  alert(errorMessage + '\n\n브라우저/기기 지원 여부를 확인하세요.');
                }
              }}
            >
              Passkey(지문/Face ID)로 등록하기
            </button>
            <button
              type="button"
              className={styles.button}
              style={{ width: '100%' }}
              onClick={() => window.location.href = '/'}
            >
              나중에 할래요
            </button>
            */}
          </div>
        )}
        <p className={styles.linkText}>
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
        <p style={{ color: '#888', fontSize: 14, marginTop: 16, textAlign: 'center' }}>
          비밀번호를 저장하면, 다음부터 지문/Face ID로 자동입력할 수 있습니다!
        </p>
      </div>
    </div>
  );
}