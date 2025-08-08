import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, doc, getDoc, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBfN3RRbzcKHRP7OoMqTDp4zSBg3DRItyE',
  authDomain: 'store-owner-web.firebaseapp.com',
  projectId: 'store-owner-web',
  storageBucket: 'store-owner-web.firebasestorage.app',
  messagingSenderId: '781532608545',
  appId: '1:781532608545:web:2af70532da2cf30ae5cb60',
  measurementId: 'G-ZKHZ2MPMKW',
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firebase Auth 초기화
export const auth = getAuth(app);

// 소셜 로그인 Provider 설정
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export const db = getFirestore(app);

// Firestore 설정
try {
  const firestoreSettings = {
    cacheSizeBytes: 50 * 1024 * 1024, // 50MB 캐시
    experimentalForceLongPolling: true, // 긴 폴링 사용
    useFetchStreams: false, // 스트림 대신 일반 fetch 사용
    ignoreUndefinedProperties: true, // undefined 속성 무시
  };
  
  // Firestore 설정 적용 (타입 체크 후)
  if ('settings' in db) {
    (db as any).settings(firestoreSettings);
  }
} catch (error) {
  console.log('Firestore 설정 적용 중 오류 (무시됨):', error);
}

export const storage = getStorage(app);
export default app;

// Firebase 연결 테스트 함수
export const testFirebaseConnection = async () => {
  try {
    console.log('Firebase 연결 테스트 시작...');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);
    
    // Firestore 연결 테스트
    const testDocRef = doc(db, '_test', 'connection');
    await getDoc(testDocRef);
    console.log('Firestore 연결 성공');
    
    // Auth 연결 테스트
    const currentUser = auth.currentUser;
    console.log('Auth 연결 성공, 현재 사용자:', currentUser ? currentUser.uid : '없음');
    
    return { success: true, message: 'Firebase 연결이 정상입니다.' };
  } catch (error: any) {
    console.error('Firebase 연결 테스트 실패:', error);
    return { 
      success: false, 
      message: 'Firebase 연결에 실패했습니다: ' + error.message,
      error: error 
    };
  }
};

// 네트워크 연결 관리 함수들
export const reconnectFirestore = async () => {
  try {
    console.log('Firestore 재연결 시도...');
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    await enableNetwork(db);
    console.log('Firestore 재연결 완료');
    return true;
  } catch (error) {
    console.error('Firestore 재연결 실패:', error);
    return false;
  }
};

// 연결 상태 확인
export const checkFirestoreConnection = async () => {
  try {
    const testDocRef = doc(db, '_test', 'connection');
    await getDoc(testDocRef);
    return true;
  } catch (error) {
    console.error('Firestore 연결 확인 실패:', error);
    return false;
  }
};

// Firebase 설정 정보 반환
export const getFirebaseConfig = () => {
  return {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    appId: firebaseConfig.appId
  };
}; 