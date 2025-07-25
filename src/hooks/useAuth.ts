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
      
      // 회원가입 중이면 user를 null로 설정
      if (registering) {
        setUser(null);
      } else {
        setUser(user);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return { user, loading, isRegistering };
} 