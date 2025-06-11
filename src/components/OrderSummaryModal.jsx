import React from 'react';

export default function OrderSummaryModal({ isOpen, onClose, orders, onUpdateQuantity, onRemoveOrder, onOrder }) {
  if (!isOpen) return null;

  const totalAmount = orders.reduce((sum, order) => sum + (order.price * order.quantity), 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            color: '#1e293b',
            fontWeight: '600'
          }}>
            주문 내역
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (window.confirm('모든 주문을 초기화하시겠습니까?')) {
                  onRemoveOrder('all');
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#fee2e2',
                color: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              초기화
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#64748b', 
            padding: '40px 0',
            fontSize: '16px'
          }}>
            아직 주문한 메뉴가 없습니다.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              {orders.map(order => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '16px',
                      color: '#1e293b',
                      fontWeight: '600'
                    }}>
                      {order.name}
                    </h3>
                    <p style={{ 
                      margin: '4px 0 0', 
                      color: '#64748b',
                      fontSize: '14px'
                    }}>
                      {order.price.toLocaleString()}원
                    </p>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => onUpdateQuantity(order.id, order.quantity - 1)}
                      style={{
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#1e293b',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      -
                    </button>
                    <span style={{ 
                      minWidth: '32px', 
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      {order.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(order.id, order.quantity + 1)}
                      style={{
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#1e293b',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemoveOrder(order.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginLeft: '8px'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '2px solid #e2e8f0',
              paddingTop: '20px',
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                총 금액: {totalAmount.toLocaleString()}원
              </div>
              <button
                onClick={onOrder}
                style={{
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                주문하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 