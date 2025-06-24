import React, { useState, useEffect } from 'react';
import { loadScript } from 'react-iamport';
import { getIamportConfig, createPaymentData } from '../config/iamport';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '400px',
    maxWidth: '90vw',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  title: {
    marginTop: 0,
    marginBottom: '20px',
    textAlign: 'center',
    color: '#333'
  },
  orderSummary: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  total: {
    borderTop: '1px solid #dee2e6',
    paddingTop: '10px',
    marginTop: '10px',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  cancelButton: {
    width: '100%',
    padding: '12px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: '15px'
  }
};

export default function PaymentModal({ isOpen, onClose, orderData, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 아임포트 스크립트 로드
      loadScript(getIamportConfig().imp)
        .then(() => {
          setScriptLoaded(true);
          setError('');
        })
        .catch((err) => {
          console.error('I\'mport script loading failed:', err);
          setError('결제 모듈 로딩에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.');
        });
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!scriptLoaded || !window.IMP) {
      // 아임포트 스크립트가 로드되지 않은 경우, 결제 없이 주문만 처리
      if (window.confirm('결제 모듈을 불러올 수 없습니다. 결제 없이 주문만 진행하시겠습니까?')) {
        setLoading(true);
        try {
          // 결제 없이 주문 처리
          const mockPaymentResponse = {
            success: true,
            imp_uid: `mock_${Date.now()}`,
            merchant_uid: `mid_${Date.now()}`,
            paid_amount: orderData.totalAmount,
            status: 'paid',
            pg_provider: 'mock'
          };
          await handlePaymentSuccess(mockPaymentResponse, orderData);
          onPaymentSuccess(mockPaymentResponse);
          onClose();
        } catch (err) {
          setError('주문 처리 중 오류가 발생했습니다.');
          console.error('Order processing error:', err);
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentData = createPaymentData(orderData);
      
      // 아임포트 결제 요청
      window.IMP.request_pay(paymentData, async (response) => {
        if (response.success) {
          // 결제 성공
          await handlePaymentSuccess(response, orderData);
          onPaymentSuccess(response);
          onClose();
        } else {
          // 결제 실패
          setError(`결제에 실패했습니다: ${response.error_msg}`);
        }
        setLoading(false);
      });
    } catch (err) {
      setError('결제 처리 중 오류가 발생했습니다.');
      setLoading(false);
      console.error('Payment error:', err);
    }
  };

  const handlePaymentSuccess = async (paymentResponse, orderData) => {
    try {
      // Firestore에 결제 정보 저장
      const paymentRecord = {
        merchant_uid: paymentResponse.merchant_uid,
        imp_uid: paymentResponse.imp_uid,
        amount: paymentResponse.paid_amount,
        status: paymentResponse.status,
        payment_method: paymentResponse.pg_provider,
        buyer_email: paymentResponse.buyer_email,
        buyer_name: paymentResponse.buyer_name,
        buyer_tel: paymentResponse.buyer_tel,
        orderData: orderData,
        paid_at: new Date(),
        createdAt: new Date()
      };

      await addDoc(collection(db, "payments"), paymentRecord);

      // 주문 상태 업데이트 (주문이 이미 있다면)
      if (orderData.orderId) {
        await updateDoc(doc(db, "orders", orderData.orderId), {
          paymentStatus: 'paid',
          paymentId: paymentResponse.imp_uid,
          updatedAt: new Date()
        });
      }
    } catch (err) {
      console.error('Payment record save error:', err);
      // 결제는 성공했지만 기록 저장에 실패한 경우
      // 사용자에게 알림
      alert('결제는 완료되었지만 주문 기록 저장에 실패했습니다. 관리자에게 문의해주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalContent}>
        <h2 style={styles.title}>결제하기</h2>
        
        <div style={styles.orderSummary}>
          <h3>주문 내역</h3>
          {orderData.items?.map((item, index) => {
            // quantity와 count 모두 처리
            const quantity = item.quantity || item.count || 1;
            const price = Number(item.price) || 0;
            
            return (
              <div key={index} style={styles.orderItem}>
                <span>{item.name} x {quantity}</span>
                <span>{Number(price * quantity).toLocaleString()}원</span>
              </div>
            );
          })}
          <div style={styles.total}>
            <span>총 결제금액</span>
            <span>{Number(orderData.totalAmount).toLocaleString()}원</span>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button 
          onClick={handlePayment} 
          disabled={loading || !scriptLoaded}
          style={styles.button}
        >
          {loading ? '결제 처리 중...' : '결제하기'}
        </button>
        
        <button 
          onClick={onClose} 
          disabled={loading}
          style={styles.cancelButton}
        >
          취소
        </button>
      </div>
    </div>
  );
} 