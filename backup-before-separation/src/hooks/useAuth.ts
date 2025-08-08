import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // 회원가입 중인지 확인 (localStorage에서 확인)
      const registering = localStorage.getItem('isRegistering') === 'true';
      setIsRegistering(registering);
      
      // 회원가입 중이면 user를 null로 설정하여 리다이렉트 방지
      if (registering) {
        setUser(null);
        console.log('회원가입 중 - 자동 리다이렉트 방지');
      } else {
        setUser(user);
        console.log('일반 로그인 상태:', user ? '로그인됨' : '로그아웃됨');
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return { user, loading, isRegistering };
} 