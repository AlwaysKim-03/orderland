import { useEffect, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // 회원가입 중인지 확인 (localStorage에서 확인)
      const registering = localStorage.getItem('isRegistering') === 'true';
      setIsRegistering(registering);
      
      // 회원가입 중이면 user를 null로 설정하여 리다이렉트 방지
      if (registering) {
        setUser(null);
        console.log('회원가입 중 - 자동 리다이렉트 방지');
        setLoading(false);
        return;
      }

      // 로그인된 사용자가 있으면 활성 상태 확인
      if (user) {
        try {
          console.log('사용자 활성 상태 확인 중...');
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // 계정이 비활성화되었는지 확인
            if (!userData.isActive) {
              console.log('비활성화된 계정 감지 - 강제 로그아웃');
              await signOut(auth);
              
              // 사용자에게 알림 (브라우저 알림 또는 토스트)
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('계정 비활성화', {
                  body: '계정이 비활성화되어 로그아웃되었습니다.',
                  icon: '/favicon.ico'
                });
              }
              
              // 로컬 스토리지에 비활성화 알림 저장
              localStorage.setItem('account-deactivated', 'true');
              localStorage.setItem('deactivation-time', new Date().toISOString());
              
              setUser(null);
              setLoading(false);
              return;
            }
            
            // 승인 상태 확인
            if (userData.approvalStatus === 'pending' || userData.approvalStatus === 'rejected') {
              console.log('승인되지 않은 계정 감지 - 강제 로그아웃');
              await signOut(auth);
              setUser(null);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('사용자 상태 확인 오류:', error);
          // 오류 발생 시에도 로그인 상태 유지 (기존 사용자 보호)
        }
      }
      
      setUser(user);
      console.log('일반 로그인 상태:', user ? '로그인됨' : '로그아웃됨');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // 실시간 사용자 상태 감지 (로그인된 사용자만)
  useEffect(() => {
    if (!user) return;

    console.log('실시간 사용자 상태 감지 시작');
    const userDocRef = doc(db, "users", user.uid);
    
    const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        console.log('실시간 사용자 상태 업데이트:', userData);
        
        // 계정이 비활성화되었는지 확인
        if (!userData.isActive) {
          console.log('실시간 감지: 비활성화된 계정 - 강제 로그아웃');
          signOut(auth);
          
          // 사용자에게 알림
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('계정 비활성화', {
              body: '계정이 비활성화되어 로그아웃되었습니다.',
              icon: '/favicon.ico'
            });
          }
          
          // 로컬 스토리지에 비활성화 알림 저장
          localStorage.setItem('account-deactivated', 'true');
          localStorage.setItem('deactivation-time', new Date().toISOString());
          
          return;
        }
        
        // 승인 상태 확인
        if (userData.approvalStatus === 'pending' || userData.approvalStatus === 'rejected') {
          console.log('실시간 감지: 승인되지 않은 계정 - 강제 로그아웃');
          signOut(auth);
          return;
        }
      }
    }, (error) => {
      console.error('실시간 사용자 상태 감지 오류:', error);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  return { user, loading, isRegistering };
} 