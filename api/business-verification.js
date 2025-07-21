// Supabase 관련 import 및 변수 선언 완전 삭제

export default async function handler(req, res) {
  console.log('[business-verification] 함수 호출됨', req.method, req.body);
  console.log('[환경변수 체크] NTS_API_KEY 존재:', !!process.env.NTS_API_KEY);
  console.log('[환경변수 체크] NTS_API_KEY 길이:', process.env.NTS_API_KEY ? process.env.NTS_API_KEY.length : 0);
  
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. 입력값 파싱
    let businessNumber, openingDate, representativeName, businessName;
    try {
      ({ businessNumber, openingDate, representativeName, businessName } = req.body);
    } catch (parseErr) {
      return res.status(400).json({ error: '[입력 파싱] req.body 파싱 실패', details: parseErr.message });
    }

    // 3. 필수 필드 검증
    if (!businessNumber || !openingDate || !representativeName || !businessName) {
      return res.status(400).json({ 
        error: '[입력 검증] 모든 필수 정보를 입력해주세요.',
        required: ['businessNumber', 'openingDate', 'representativeName', 'businessName']
      });
    }
    // 4. 사업자번호 기본 형식 검증 (체크섬 검증 완화)
    if (!/^\d{10}$/.test(businessNumber)) {
      return res.status(400).json({
        verified: false,
        message: '사업자번호는 10자리 숫자로 입력해주세요.'
      });
    }
    if (!/^\d{8}$/.test(openingDate)) {
      return res.status(400).json({ error: '[입력 검증] 개업일자는 YYYYMMDD 8자리 숫자로 입력해주세요.' });
    }

    // 5. 국세청 API 키가 있으면 실제 API 호출, 없으면 개발 모드
    if (process.env.NTS_API_KEY) {
      let verificationResult;
      try {
        verificationResult = await verifyBusinessWithNTS(businessNumber, openingDate, representativeName, businessName);
      } catch (ntsErr) {
        console.error('[국세청 API 호출] 실패:', ntsErr);
        return res.status(500).json({ error: '[국세청 API 호출] 실패', details: ntsErr.message });
      }

      if (verificationResult.success) {
        const businessData = {
          businessNumber,
          openingDate,
          representativeName,
          businessName,
          verifiedAt: new Date().toISOString(),
          status: 'verified',
          ntsResponse: verificationResult.data
        };
        return res.status(200).json({
          verified: true,
          message: '사업자 인증이 완료되었습니다.',
          data: businessData
        });
      } else {
        return res.status(400).json({
          verified: false,
          message: verificationResult.error || '사업자 정보 인증에 실패했습니다.'
        });
      }
    } else {
      // 개발 모드: 기본 검증만 수행 (체크섬 검증 제외)
      console.log('개발 모드: 기본 검증만 수행합니다.');
      
      const businessData = {
        businessNumber,
        openingDate,
        representativeName,
        businessName,
        verifiedAt: new Date().toISOString(),
        status: 'verified'
      };
      
      return res.status(200).json({
        verified: true,
        message: '개발 모드: 사업자 인증이 완료되었습니다.',
        data: businessData
      });
    }
  } catch (error) {
    console.error('사업자 인증 전체 오류:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: '[전체 예외] ' + (error.message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    });
  }
}

// 국세청 오픈API 호출 함수
async function verifyBusinessWithNTS(businessNumber, openingDate, representativeName, businessName) {
  try {
    // 국세청 오픈API 엔드포인트
    const ntsApiUrl = 'https://api.odcloud.kr/api/nts-businessman/v1/validate';
    const apiKey = process.env.NTS_API_KEY;
    const body = {
      businesses: [
        {
          b_no: businessNumber,
          start_dt: openingDate,
          p_nm: representativeName,
          b_nm: businessName
        }
      ]
    };

    const response = await fetch(`${ntsApiUrl}?serviceKey=${apiKey}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[국세청 API 응답 오류]', response.status, text);
      throw new Error(`[국세청 API 응답 오류] status: ${response.status}, body: ${text}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.error('[국세청 API JSON 파싱 오류]', jsonErr);
      throw new Error('[국세청 API JSON 파싱 오류] ' + jsonErr.message);
    }

    if (Array.isArray(data.data) && data.data.length > 0) {
      const result = data.data[0];
      if (result.valid === '01') {
        return { success: true, data: result };
      } else {
        return {
          success: false,
          error: result.valid_msg || '사업자 정보가 일치하지 않습니다.',
          details: result
        };
      }
    } else {
      return {
        success: false,
        error: '[국세청 API] 응답 데이터 없음',
        details: data
      };
    }
  } catch (error) {
    return {
      success: false,
      error: '[국세청 API 호출 예외] ' + (error.message || error)
    };
  }
} 