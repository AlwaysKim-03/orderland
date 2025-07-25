const axios = require('axios');

// 국세청 API 설정
const TAX_OFFICE_CONFIG = {
  baseURL: process.env.TAX_OFFICE_API_URL || "https://api.odcloud.kr/api/nts-businessman/v1",
  serviceKey: process.env.TAX_OFFICE_SERVICE_KEY || "",
  apiKey: process.env.TAX_OFFICE_API_KEY || ""
};

// 사업자등록번호 체크섬 검증 함수
function validateBusinessNumber(businessNumber) {
  if (!/^\d{10}$/.test(businessNumber)) {
    return false;
  }

  const digits = businessNumber.split('').map(Number);
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return digits[9] === checkDigit;
}

module.exports = async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessNumber, businessName, representativeName, openingDate } = req.body;

    // 입력값 검증
    if (!businessNumber || !businessName || !representativeName || !openingDate) {
      return res.status(400).json({
        verified: false,
        message: '모든 필드를 입력해주세요.'
      });
    }

    // 사업자등록번호 체크섬 검증
    if (!validateBusinessNumber(businessNumber)) {
      return res.status(400).json({
        verified: false,
        message: '올바르지 않은 사업자등록번호입니다.'
      });
    }

    // 실제 국세청 API 호출
    if (TAX_OFFICE_CONFIG.serviceKey) {
      try {
        const response = await axios.get(`${TAX_OFFICE_CONFIG.baseURL}/status`, {
          params: {
            serviceKey: TAX_OFFICE_CONFIG.serviceKey,
            b_no: businessNumber
          },
          timeout: 10000
        });

        console.log('국세청 API 응답:', response.data);

        // API 응답에 따른 검증 결과 반환
        if (response.data && response.data.data) {
          const businessData = response.data.data[0];
          
          if (businessData.b_stt === '01') { // 정상
            // 상호명과 대표자명 일치 여부 확인
            const nameMatch = businessData.company_name && 
              businessData.company_name.includes(businessName);
            const repMatch = businessData.company_name && 
              businessData.company_name.includes(representativeName);

            if (nameMatch || repMatch) {
              return res.json({
                verified: true,
                message: '사업자등록번호 인증이 완료되었습니다.',
                data: {
                  businessNumber,
                  businessName: businessData.company_name,
                  representativeName: businessData.company_name,
                  openingDate,
                  status: businessData.b_stt_cd
                }
              });
            } else {
              return res.json({
                verified: false,
                message: '상호명 또는 대표자명이 일치하지 않습니다.'
              });
            }
          } else {
            return res.json({
              verified: false,
              message: '등록되지 않은 사업자등록번호입니다.'
            });
          }
        } else {
          return res.json({
            verified: false,
            message: '사업자등록번호 확인에 실패했습니다.'
          });
        }
      } catch (apiError) {
        console.error('국세청 API 호출 오류:', apiError);
        
        return res.status(500).json({
          verified: false,
          message: '사업자등록번호 확인 서비스에 일시적인 오류가 발생했습니다.'
        });
      }
    } else {
      // 서비스키가 없는 경우 개발 모드로 응답
      console.log('개발 모드: 서비스키가 설정되지 않음');
      return res.json({
        verified: true,
        message: '개발 모드: 사업자등록번호 인증이 완료되었습니다. (실제 API 키가 필요합니다)',
        data: {
          businessNumber,
          businessName,
          representativeName,
          openingDate,
          status: '01'
        }
      });
    }

  } catch (error) {
    console.error('사업자등록번호 확인 오류:', error);
    return res.status(500).json({
      verified: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
}; 