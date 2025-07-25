const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 국세청 API 설정
const TAX_OFFICE_CONFIG = {
  baseURL: process.env.TAX_OFFICE_API_URL || "https://api.odcloud.kr/api/nts-businessman/v1",
  serviceKey: process.env.TAX_OFFICE_SERVICE_KEY || "",
  apiKey: process.env.TAX_OFFICE_API_KEY || ""
};

// 환경변수 디버깅
console.log('환경변수 디버깅:');
console.log('TAX_OFFICE_SERVICE_KEY:', process.env.TAX_OFFICE_SERVICE_KEY ? '설정됨' : '설정되지 않음');
console.log('TAX_OFFICE_SERVICE_KEY 길이:', process.env.TAX_OFFICE_SERVICE_KEY ? process.env.TAX_OFFICE_SERVICE_KEY.length : 0);

// 사업자등록번호 진위확인 API
app.post('/api/verify-business', async (req, res) => {
  try {
    const { businessNumber, businessName, representativeName, openingDate } = req.body;

    // 입력값 검증
    if (!businessNumber || !businessName || !representativeName || !openingDate) {
      return res.status(400).json({
        verified: false,
        message: '모든 필드를 입력해주세요.'
      });
    }

    // 사업자등록번호 형식 검증
    if (!/^\d{10}$/.test(businessNumber)) {
      return res.status(400).json({
        verified: false,
        message: '사업자등록번호는 10자리 숫자여야 합니다.'
      });
    }

    // 체크섬 검증
    const digits = businessNumber.split('').map(Number);
    const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * weights[i];
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    
    if (digits[9] !== checkDigit) {
      return res.status(400).json({
        verified: false,
        message: '올바르지 않은 사업자등록번호입니다.'
      });
    }

    // 실제 국세청 API 호출 (프로덕션 환경에서만)
    if (TAX_OFFICE_CONFIG.serviceKey && process.env.NODE_ENV === 'production') {
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
            // 상호명과 대표자명 일치 여부 확인 (실제로는 더 정확한 매칭 로직 필요)
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
      // 개발 환경이거나 서비스키가 없는 경우 개발 모드로 응답
      console.log('개발 모드: 사업자등록번호 인증 완료');
      
      return res.json({
        verified: true,
        message: '개발 모드: 사업자등록번호 인증이 완료되었습니다.',
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
});

// RegisterPage에서 사용하는 엔드포인트 (기존 verify-business와 동일한 로직)
app.post('/api/business-verification', async (req, res) => {
  try {
    const { businessNumber, businessName, representativeName, openingDate } = req.body;

    // 입력값 검증
    if (!businessNumber || !businessName || !representativeName || !openingDate) {
      return res.status(400).json({
        verified: false,
        message: '모든 필드를 입력해주세요.'
      });
    }

    // 사업자등록번호 형식 검증
    if (!/^\d{10}$/.test(businessNumber)) {
      return res.status(400).json({
        verified: false,
        message: '사업자등록번호는 10자리 숫자여야 합니다.'
      });
    }

    // 체크섬 검증
    const digits = businessNumber.split('').map(Number);
    const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * weights[i];
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    
    if (digits[9] !== checkDigit) {
      return res.status(400).json({
        verified: false,
        message: '올바르지 않은 사업자등록번호입니다.'
      });
    }

    // 실제 국세청 API 호출 (프로덕션 환경에서만)
    if (TAX_OFFICE_CONFIG.serviceKey && process.env.NODE_ENV === 'production') {
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
            // 상호명과 대표자명 일치 여부 확인 (실제로는 더 정확한 매칭 로직 필요)
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
      // 개발 환경이거나 서비스키가 없는 경우 개발 모드로 응답
      console.log('개발 모드: 사업자등록번호 인증 완료');
      
      return res.json({
        verified: true,
        message: '개발 모드: 사업자등록번호 인증이 완료되었습니다.',
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
});

// 헬스체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`사업자 인증 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`국세청 API 서비스키: ${TAX_OFFICE_CONFIG.serviceKey ? '설정됨' : '설정되지 않음'}`);
});

module.exports = app; 