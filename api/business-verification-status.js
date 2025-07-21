import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.VERCEL_SUPABASE_URL;
const supabaseServiceKey = process.env.VERCEL_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessNumber } = req.query;

    if (!businessNumber) {
      return res.status(400).json({ 
        error: '사업자번호가 필요합니다.' 
      });
    }

    // 사업자번호 형식 검증
    if (!/^\d{10}$/.test(businessNumber)) {
      return res.status(400).json({ 
        error: '사업자번호는 10자리 숫자로 입력해주세요.' 
      });
    }

    // Supabase에서 인증 정보 조회
    const { data, error } = await supabase
      .from('business_verifications')
      .select('*')
      .eq('businessNumber', businessNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우
        return res.status(200).json({
          success: true,
          verified: false,
          message: '인증되지 않은 사업자번호입니다.'
        });
      }
      throw error;
    }

    if (data) {
      return res.status(200).json({
        success: true,
        verified: true,
        data: {
          businessNumber: data.businessNumber,
          businessName: data.businessName,
          representativeName: data.representativeName,
          openingDate: data.openingDate,
          verifiedAt: data.verifiedAt,
          status: data.status
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        verified: false,
        message: '인증되지 않은 사업자번호입니다.'
      });
    }

  } catch (error) {
    console.error('사업자 인증 상태 확인 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
    });
  }
} 