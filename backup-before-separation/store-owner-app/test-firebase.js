// Firebase 연결 테스트 스크립트
// 이 파일을 실행하여 Firebase 연결 상태를 확인할 수 있습니다.

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBfN3RRbzcKHRP7OoMqTDp4zSBg3DRItyE',
  authDomain: 'store-owner-web.firebaseapp.com',
  projectId: 'store-owner-web',
  storageBucket: 'store-owner-web.firebasestorage.app',
  messagingSenderId: '781532608545',
  appId: '1:781532608545:web:2af70532da2cf30ae5cb60',
  measurementId: 'G-ZKHZ2MPMKW',
};

async function testFirebaseConnection() {
  console.log('🔥 Firebase 연결 테스트 시작...');
  
  try {
    // 1. Firebase 앱 초기화
    console.log('1. Firebase 앱 초기화...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase 앱 초기화 성공');
    
    // 2. Auth 연결 테스트
    console.log('2. Firebase Auth 연결 테스트...');
    const auth = getAuth(app);
    console.log('✅ Firebase Auth 연결 성공');
    
    // 3. Firestore 연결 테스트
    console.log('3. Firestore 연결 테스트...');
    const db = getFirestore(app);
    console.log('✅ Firestore 연결 성공');
    
    // 4. 데이터 읽기 테스트
    console.log('4. 데이터 읽기 테스트...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`✅ users 컬렉션 읽기 성공 (${usersSnapshot.size}개 문서)`);
    
    // 5. 쿼리 테스트
    console.log('5. 쿼리 테스트...');
    const testQuery = query(collection(db, 'users'), where('store_name', '==', '테스트'));
    const querySnapshot = await getDocs(testQuery);
    console.log(`✅ 쿼리 실행 성공 (${querySnapshot.size}개 결과)`);
    
    console.log('\n🎉 모든 Firebase 연결 테스트가 성공했습니다!');
    console.log('\n📊 Firebase 설정 정보:');
    console.log(`- Project ID: ${firebaseConfig.projectId}`);
    console.log(`- Auth Domain: ${firebaseConfig.authDomain}`);
    console.log(`- Storage Bucket: ${firebaseConfig.storageBucket}`);
    console.log(`- App ID: ${firebaseConfig.appId}`);
    
    return { success: true, message: 'Firebase 연결이 정상입니다.' };
    
  } catch (error) {
    console.error('❌ Firebase 연결 테스트 실패:', error);
    console.error('오류 코드:', error.code);
    console.error('오류 메시지:', error.message);
    
    return { 
      success: false, 
      message: 'Firebase 연결에 실패했습니다: ' + error.message,
      error: error 
    };
  }
}

// Node.js 환경에서 실행할 경우
if (typeof window === 'undefined') {
  testFirebaseConnection()
    .then(result => {
      if (result.success) {
        console.log('✅ 테스트 완료: 성공');
        process.exit(0);
      } else {
        console.log('❌ 테스트 완료: 실패');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 테스트 실행 중 오류:', error);
      process.exit(1);
    });
}

export { testFirebaseConnection }; 