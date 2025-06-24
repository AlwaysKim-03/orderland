// 아임포트 설정
export const IAMPORT_CONFIG = {
  // 테스트 환경 (개발용)
  test: {
    imp: 'imp00000000', // 아임포트 테스트 가맹점 식별코드
    pg: 'html5_inicis', // 결제 PG사 (이니시스)
    pay_method: 'card', // 결제수단
    currency: 'KRW', // 통화
    language: 'ko_KR', // 언어
    buyer_tel: '010-1234-5678', // 구매자 전화번호
  },
  
  // 실제 운영 환경 (배포용)
  production: {
    imp: process.env.REACT_APP_IAMPORT_IMP_CODE, // 실제 가맹점 식별코드
    pg: process.env.REACT_APP_IAMPORT_PG || 'html5_inicis',
    pay_method: 'card',
    currency: 'KRW',
    language: 'ko_KR',
  }
};

// 현재 환경에 따른 설정 반환
export const getIamportConfig = () => {
  return process.env.NODE_ENV === 'production' 
    ? IAMPORT_CONFIG.production 
    : IAMPORT_CONFIG.test;
};

// 결제 요청 데이터 생성 함수
export const createPaymentData = (orderData) => {
  const config = getIamportConfig();
  
  return {
    pg: config.pg,
    pay_method: config.pay_method,
    merchant_uid: `mid_${Date.now()}`, // 주문번호 (고유값)
    amount: orderData.totalAmount, // 결제금액
    name: orderData.storeName, // 주문명
    buyer_email: orderData.buyerEmail || 'test@test.com',
    buyer_name: orderData.buyerName || '구매자',
    buyer_tel: orderData.buyerTel || config.buyer_tel,
    buyer_addr: orderData.buyerAddr || '서울특별시 강남구 삼성동',
    buyer_postcode: orderData.buyerPostcode || '123-456',
    currency: config.currency,
    language: config.language,
    notice_url: `${window.location.origin}/api/payment/notify`, // 결제 완료 후 알림 URL
    popup: false,
  };
}; 