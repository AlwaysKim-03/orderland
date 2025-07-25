// 워드프레스 API 설정
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "https://happyfabric02.mycafe24.com/wp-json",
  wpAuthToken: btoa(import.meta.env.VITE_WP_ADMIN_USER + ':' + import.meta.env.VITE_WP_APP_PASSWORD)
};

// 사업자 인증 기능 (현재 숨김 처리)
/*
// 국세청 사업자등록번호 진위확인 API 설정
export const TAX_OFFICE_CONFIG = {
  // 국세청 API는 실제로는 별도 서버에서 프록시해야 함 (CORS 이슈)
  // 여기서는 예시용으로 설정
  baseURL: import.meta.env.VITE_TAX_OFFICE_API_URL || "https://api.odcloud.kr/api/nts-businessman/v1",
  apiKey: import.meta.env.VITE_TAX_OFFICE_API_KEY || "",
  serviceKey: import.meta.env.VITE_TAX_OFFICE_SERVICE_KEY || ""
};

// 사업자등록번호 진위확인 함수
export const verifyBusinessNumber = async (businessNumber, businessName, representativeName) => {
  try {
    // 실제 구현에서는 백엔드 서버를 통해 국세청 API 호출
    // 프론트엔드에서 직접 호출하면 CORS 문제 발생
    
    // 임시 구현: 기본적인 형식 검증만 수행
    if (!businessNumber || businessNumber.length !== 10) {
      throw new Error('사업자등록번호는 10자리여야 합니다.');
    }
    
    if (!/^\d{10}$/.test(businessNumber)) {
      throw new Error('사업자등록번호는 숫자만 입력 가능합니다.');
    }
    
    // 실제 API 호출 대신 시뮬레이션
    const response = await fetch('/api/verify-business', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessNumber,
        businessName,
        representativeName
      })
    });
    
    if (!response.ok) {
      throw new Error('사업자등록번호 확인에 실패했습니다.');
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('사업자등록번호 확인 오류:', error);
    throw error;
  }
};

// 사업자등록번호 형식 검증 함수
export const validateBusinessNumber = (businessNumber) => {
  // 10자리 숫자인지 확인
  if (!businessNumber || businessNumber.length !== 10) {
    return { isValid: false, message: '사업자등록번호는 10자리여야 합니다.' };
  }
  
  if (!/^\d{10}$/.test(businessNumber)) {
    return { isValid: false, message: '사업자등록번호는 숫자만 입력 가능합니다.' };
  }
  
  // 체크섬 검증 (간단한 버전)
  const digits = businessNumber.split('').map(Number);
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  if (digits[9] !== checkDigit) {
    return { isValid: false, message: '올바르지 않은 사업자등록번호입니다.' };
  }
  
  return { isValid: true, message: '사업자등록번호 형식이 올바릅니다.' };
};

// 사업자등록번호 하이픈 추가 함수
export const formatBusinessNumber = (businessNumber) => {
  const cleaned = businessNumber.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 5) return cleaned.replace(/(\d{3})(\d{1,2})/, '$1-$2');
  return cleaned.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
};
*/ 