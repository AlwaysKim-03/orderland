import React, { useState, useEffect } from 'react';
import { 
  verifyBusiness, 
  validateBusinessData,
  validateBusinessNumber,
  validateOpeningDate,
  validateRepresentativeName,
  validateBusinessName
} from '../api/business-verification';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const BusinessVerificationModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    businessNumber: '',
    openingDate: '',
    representativeName: '',
    businessName: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, loading, success, error
  const [verificationMessage, setVerificationMessage] = useState('');

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 실시간 유효성 검사
    validateField(name, value);
  };

  // 개별 필드 유효성 검사
  const validateField = (fieldName, value) => {
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
      case 'businessNumber':
        isValid = validateBusinessNumber(value);
        errorMessage = isValid ? '' : '사업자번호는 10자리 숫자로 입력해주세요.';
        break;
      case 'openingDate':
        isValid = validateOpeningDate(value);
        errorMessage = isValid ? '' : '올바른 개업일자를 입력해주세요. (YYYY-MM-DD)';
        break;
      case 'representativeName':
        isValid = validateRepresentativeName(value);
        errorMessage = isValid ? '' : '대표자명은 2-20자의 한글 또는 영문으로 입력해주세요.';
        break;
      case 'businessName':
        isValid = validateBusinessName(value);
        errorMessage = isValid ? '' : '상호명은 2-50자의 한글, 영문, 숫자로 입력해주세요.';
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));

    return isValid;
  };

  // 사업자번호 자동 포맷팅
  const handleBusinessNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // 숫자만 추출
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      businessNumber: value
    }));

    validateField('businessNumber', value);
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 전체 유효성 검사
    const validation = validateBusinessData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setVerificationStatus('loading');
    setVerificationMessage('사업자 정보를 확인하고 있습니다...');

    try {
      // 날짜 포맷 변환: YYYY-MM-DD → YYYYMMDD
      const formattedOpeningDate = formData.openingDate.replace(/-/g, '');
      const requestData = {
        ...formData,
        openingDate: formattedOpeningDate
      };
      // 사업자 인증 API 호출
      const result = await verifyBusiness(requestData);

      if (result.verified) {
        // Firestore에 인증 정보 저장
        const verificationData = {
          businessNumber: result.data.businessNumber,
          businessName: result.data.businessName,
          representativeName: result.data.representativeName,
          openingDate: result.data.openingDate,
          verifiedAt: new Date().toISOString(),
          status: 'verified',
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'businessVerifications', user.uid), verificationData);

        setVerificationStatus('success');
        setVerificationMessage('사업자 인증이 완료되었습니다!');
        
        // 성공 콜백 호출
        if (onSuccess) {
          onSuccess(verificationData);
        }

        // 2초 후 모달 닫기
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setVerificationStatus('error');
        setVerificationMessage(result.message || '사업자 인증에 실패했습니다.');
      }
    } catch (error) {
      console.error('사업자 인증 오류:', error);
      setVerificationStatus('error');
      setVerificationMessage(error.message || '사업자 인증 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        businessNumber: '',
        openingDate: '',
        representativeName: '',
        businessName: ''
      });
      setErrors({});
      setVerificationStatus('idle');
      setVerificationMessage('');
      onClose();
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">사업자 인증</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 사업자번호 */}
            <div>
              <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-1">
                사업자번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessNumber"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleBusinessNumberChange}
                placeholder="1234567890"
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.businessNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.businessNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.businessNumber}</p>
              )}
            </div>

            {/* 개업일자 */}
            <div>
              <label htmlFor="openingDate" className="block text-sm font-medium text-gray-700 mb-1">
                개업일자 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="openingDate"
                name="openingDate"
                value={formData.openingDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.openingDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.openingDate && (
                <p className="mt-1 text-sm text-red-600">{errors.openingDate}</p>
              )}
            </div>

            {/* 대표자명 */}
            <div>
              <label htmlFor="representativeName" className="block text-sm font-medium text-gray-700 mb-1">
                대표자명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="representativeName"
                name="representativeName"
                value={formData.representativeName}
                onChange={handleInputChange}
                placeholder="홍길동"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.representativeName ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.representativeName && (
                <p className="mt-1 text-sm text-red-600">{errors.representativeName}</p>
              )}
            </div>

            {/* 상호명 */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                상호명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="(주)맛있는식당"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.businessName ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            {/* 인증 상태 메시지 */}
            {verificationMessage && (
              <div className={`p-3 rounded-md ${
                verificationStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                verificationStatus === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {verificationMessage}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || !Object.values(errors).every(error => !error)}
                className="flex-1 px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    인증 중...
                  </div>
                ) : (
                  '인증하기'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessVerificationModal; 