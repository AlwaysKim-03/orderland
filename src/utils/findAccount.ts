// Find ID/Password 유틸리티

interface FindAccountRequest {
  type: 'findId' | 'findPassword';
  phone?: string;
  email?: string;
  businessNumber?: string;
}

interface FindAccountResponse {
  success: boolean;
  message: string;
  data?: {
    email?: string;
    resetLink?: string;
  };
}

// 전화번호로 ID 찾기
export const findIdByPhone = async (phone: string): Promise<FindAccountResponse> => {
  try {
    // Firebase에서 전화번호로 사용자 검색
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phone));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: '해당 전화번호로 등록된 계정을 찾을 수 없습니다.'
      };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // 이메일 마스킹 처리
    const email = userData.email;
    const maskedEmail = maskEmail(email);
    
    return {
      success: true,
      message: '계정을 찾았습니다.',
      data: {
        email: maskedEmail
      }
    };
  } catch (error) {
    console.error('ID 찾기 오류:', error);
    return {
      success: false,
      message: '계정 찾기 중 오류가 발생했습니다.'
    };
  }
};

// 이메일과 전화번호로 비밀번호 찾기
export const findPasswordByEmailAndPhone = async (email: string, phone: string): Promise<FindAccountResponse> => {
  try {
    // Firebase에서 이메일과 전화번호로 사용자 검색
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('email', '==', email),
      where('phoneNumber', '==', phone)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: '해당 이메일과 전화번호로 등록된 계정을 찾을 수 없습니다.'
      };
    }
    
    // Firebase Auth를 사용하여 비밀번호 재설정 이메일 발송
    const { sendPasswordResetEmail } = await import('firebase/auth');
    const { auth } = await import('../firebase');
    
    await sendPasswordResetEmail(auth, email);
    
    return {
      success: true,
      message: '비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.',
      data: {
        email: maskEmail(email)
      }
    };
  } catch (error) {
    console.error('비밀번호 찾기 오류:', error);
    return {
      success: false,
      message: '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.'
    };
  }
};

// 사업자등록번호로 ID 찾기
export const findIdByBusinessNumber = async (businessNumber: string): Promise<FindAccountResponse> => {
  try {
    // Firebase에서 사업자등록번호로 사용자 검색
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('businessNumber', '==', businessNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        message: '해당 사업자등록번호로 등록된 계정을 찾을 수 없습니다.'
      };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // 이메일 마스킹 처리
    const email = userData.email;
    const maskedEmail = maskEmail(email);
    
    return {
      success: true,
      message: '계정을 찾았습니다.',
      data: {
        email: maskedEmail
      }
    };
  } catch (error) {
    console.error('ID 찾기 오류:', error);
    return {
      success: false,
      message: '계정 찾기 중 오류가 발생했습니다.'
    };
  }
};

// 이메일 마스킹 처리
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return email;
  }
  
  const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
};

// 전화번호 형식 검증
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
  return phoneRegex.test(phone);
};

// 이메일 형식 검증
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 사업자등록번호 형식 검증
export const validateBusinessNumber = (businessNumber: string): boolean => {
  const businessNumberRegex = /^[0-9]{3}-[0-9]{2}-[0-9]{5}$/;
  return businessNumberRegex.test(businessNumber);
};

// SMS 인증번호 생성
export const generateVerificationCode = (): string => {
  return Math.random().toString().substr(2, 6);
};

// SMS 인증번호 발송 (실제 구현은 SMS 서비스 연동 필요)
export const sendVerificationSMS = async (phone: string, code: string): Promise<boolean> => {
  try {
    // 실제 구현에서는 SMS 서비스 API를 호출
    console.log(`SMS 인증번호 발송: ${phone} -> ${code}`);
    
    // 임시로 성공 반환 (실제로는 SMS 서비스 응답 확인)
    return true;
  } catch (error) {
    console.error('SMS 발송 실패:', error);
    return false;
  }
};

// 이메일 인증번호 발송
export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    // 실제 구현에서는 이메일 서비스 API를 호출
    console.log(`이메일 인증번호 발송: ${email} -> ${code}`);
    
    // 임시로 성공 반환 (실제로는 이메일 서비스 응답 확인)
    return true;
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return false;
  }
}; 