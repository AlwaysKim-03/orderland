import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

// 사용자 타입 정의
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  businessName?: string;
  businessNumber?: string;
  businessType?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 회원가입 함수
export const signUp = async (
  email: string, 
  password: string, 
  displayName: string,
  phoneNumber: string,
  businessName: string,
  businessNumber: string,
  businessType: string
): Promise<UserCredential> => {
  try {
    // Firebase Auth로 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 사용자 프로필 업데이트
    await updateProfile(user, {
      displayName: displayName
    });

    // Firestore에 사용자 정보 저장
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      phoneNumber,
      businessName,
      businessNumber,
      businessType,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return userCredential;
  } catch (error: any) {
    console.error('회원가입 오류:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// 로그인 함수
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    console.error('로그인 오류:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// 로그아웃 함수
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('로그아웃 오류:', error);
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }
};

// 비밀번호 재설정 이메일 발송
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('비밀번호 재설정 오류:', error);
    throw new Error(getAuthErrorMessage(error.code));
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
    console.error('사용자 프로필 가져오기 오류:', error);
    throw new Error('사용자 정보를 가져오는 중 오류가 발생했습니다.');
  }
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// 인증 상태 변경 리스너
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

// Firebase Auth 오류 메시지 변환
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/invalid-email':
      return '유효하지 않은 이메일 형식입니다.';
    case 'auth/operation-not-allowed':
      return '이메일/비밀번호 로그인이 비활성화되어 있습니다.';
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다. 6자 이상으로 설정해주세요.';
    case 'auth/user-disabled':
      return '비활성화된 계정입니다.';
    case 'auth/user-not-found':
      return '등록되지 않은 이메일입니다.';
    case 'auth/wrong-password':
      return '잘못된 비밀번호입니다.';
    case 'auth/too-many-requests':
      return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해주세요.';
    default:
      return '인증 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
};

// 이메일 형식 검증
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 강도 검증
export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: '비밀번호는 6자 이상이어야 합니다.' };
  }
  return { isValid: true, message: '유효한 비밀번호입니다.' };
};

// 전화번호 형식 검증
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^[0-9-+\s()]+$/;
  return phoneRegex.test(phoneNumber) && phoneNumber.length >= 10;
}; 