// 사업자 인증 API 함수들

/**
 * 사업자 인증 요청
 * @param {Object} businessData - 사업자 정보
 * @param {string} businessData.businessNumber - 사업자번호 (10자리)
 * @param {string} businessData.openingDate - 개업일자 (YYYY-MM-DD)
 * @param {string} businessData.representativeName - 대표자명
 * @param {string} businessData.businessName - 상호명
 * @returns {Promise<Object>} 인증 결과
 */
export const verifyBusiness = async (businessData) => {
  try {
    // Vercel 서버리스 함수 사용
    const response = await fetch('/api/business-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || '사업자 인증에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('사업자 인증 API 오류:', error);
    throw error;
  }
};

/**
 * 사업자 인증 상태 확인
 * @param {string} businessNumber - 사업자번호
 * @returns {Promise<Object>} 인증 상태 정보
 */
export const getBusinessVerificationStatus = async (businessNumber) => {
  try {
    const response = await fetch(`/api/business-verification/status?businessNumber=${businessNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '인증 상태 확인에 실패했습니다.');
    }

    return result;
  } catch (error) {
    console.error('인증 상태 확인 API 오류:', error);
    throw error;
  }
};

/**
 * 사업자번호 형식 검증
 * @param {string} businessNumber - 사업자번호
 * @returns {boolean} 유효성 여부
 */
export const validateBusinessNumber = (businessNumber) => {
  // 10자리 숫자 검증
  const businessNumberRegex = /^\d{10}$/;
  return businessNumberRegex.test(businessNumber);
};

/**
 * 개업일자 형식 검증
 * @param {string} openingDate - 개업일자
 * @returns {boolean} 유효성 여부
 */
export const validateOpeningDate = (openingDate) => {
  // YYYY-MM-DD 형식 검증
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(openingDate)) {
    return false;
  }

  // 실제 날짜인지 확인
  const date = new Date(openingDate);
  return date instanceof Date && !isNaN(date);
};

/**
 * 대표자명 검증
 * @param {string} representativeName - 대표자명
 * @returns {boolean} 유효성 여부
 */
export const validateRepresentativeName = (representativeName) => {
  // 한글, 영문, 공백만 허용 (2-20자)
  const nameRegex = /^[가-힣a-zA-Z\s]{2,20}$/;
  return nameRegex.test(representativeName.trim());
};

/**
 * 상호명 검증
 * @param {string} businessName - 상호명
 * @returns {boolean} 유효성 여부
 */
export const validateBusinessName = (businessName) => {
  // 한글, 영문, 숫자, 특수문자 일부 허용 (2-50자)
  const businessNameRegex = /^[가-힣a-zA-Z0-9\s\-()&.,]{2,50}$/;
  return businessNameRegex.test(businessName.trim());
};

/**
 * 전체 사업자 정보 검증
 * @param {Object} businessData - 사업자 정보
 * @returns {Object} 검증 결과
 */
export const validateBusinessData = (businessData) => {
  const errors = {};

  if (!validateBusinessNumber(businessData.businessNumber)) {
    errors.businessNumber = '사업자번호는 10자리 숫자로 입력해주세요.';
  }

  if (!validateOpeningDate(businessData.openingDate)) {
    errors.openingDate = '올바른 개업일자를 입력해주세요. (YYYY-MM-DD)';
  }

  if (!validateRepresentativeName(businessData.representativeName)) {
    errors.representativeName = '대표자명은 2-20자의 한글 또는 영문으로 입력해주세요.';
  }

  if (!validateBusinessName(businessData.businessName)) {
    errors.businessName = '상호명은 2-50자의 한글, 영문, 숫자로 입력해주세요.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}; 