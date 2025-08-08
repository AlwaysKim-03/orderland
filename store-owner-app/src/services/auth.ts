import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from '../lib/firebase';

// 사용자 타입 정의
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  storeName?: string;
  storeType?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// 이메일/비밀번호 로그인
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await updateLastLogin(result.user.uid);
    return result;
  } catch (error: any) {
    throw new Error(`로그인 실패: ${error.message}`);
  }
};

// 이메일/비밀번호 회원가입
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // 사용자 프로필 생성
    const userProfile: UserProfile = {
      uid: result.user.uid,
      email: result.user.email!,
      displayName,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', result.user.uid), userProfile);
    return result;
  } catch (error: any) {
    throw new Error(`회원가입 실패: ${error.message}`);
  }
};

// Google 로그인
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // 기존 사용자인지 확인
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // 새 사용자 프로필 생성
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || undefined,
        photoURL: result.user.photoURL || undefined,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
    } else {
      // 마지막 로그인 시간 업데이트
      await updateLastLogin(result.user.uid);
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Google 로그인 실패: ${error.message}`);
  }
};

// Apple 로그인
export const signInWithApple = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    
    // 기존 사용자인지 확인
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // 새 사용자 프로필 생성
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || undefined,
        photoURL: result.user.photoURL || undefined,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
    } else {
      // 마지막 로그인 시간 업데이트
      await updateLastLogin(result.user.uid);
    }
    
    return result;
  } catch (error: any) {
    throw new Error(`Apple 로그인 실패: ${error.message}`);
  }
};

// 로그아웃
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(`로그아웃 실패: ${error.message}`);
  }
};

// 사용자 프로필 가져오기
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    throw new Error(`사용자 프로필 조회 실패: ${error.message}`);
  }
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      lastLoginAt: new Date(),
    });
  } catch (error: any) {
    throw new Error(`프로필 업데이트 실패: ${error.message}`);
  }
};

// 마지막 로그인 시간 업데이트
const updateLastLogin = async (uid: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      lastLoginAt: new Date(),
    });
  } catch (error) {
    console.error('마지막 로그인 시간 업데이트 실패:', error);
  }
};

// 인증 상태 변경 리스너
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
}; 