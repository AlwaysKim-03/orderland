import React, { useState, useMemo, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const styles = {
  container: { padding: '20px', fontFamily: 'sans-serif', background: '#f8fafc' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  periodSelector: { display: 'flex', gap: '8px' },
  periodButton: (isActive) => ({
    padding: '8px 16px',
    border: `1px solid ${isActive ? '#3b82f6' : '#cbd5e1'}`,
    borderRadius: '6px',
    background: isActive ? '#3b82f6' : '#fff',
    color: isActive ? '#fff' : '#334155',
    fontWeight: '600',
    cursor: 'pointer',
  }),
  cardContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardTitle: { margin: '0 0 10px', fontSize: '16px', color: '#64748b' },
  cardValue: { margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#1e293b' },
  tableContainer: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { borderBottom: '2px solid #e2e8f0', padding: '12px', textAlign: 'left', color: '#64748b' },
  td: { borderBottom: '1px solid #f1f5f9', padding: '12px' },
};

function decodeUnicodeHex(str) {
  return str.replace(/u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}
function safeDecode(name) {
  try {
    if (/^(u[0-9a-fA-F]{4})+$/.test(name)) return decodeUnicodeHex(name);
    if (/^%[0-9A-Fa-f]{2}/.test(name)) return decodeURIComponent(name);
    return name;
  } catch {
    return name;
  }
}

// 날짜 키 생성 함수
function getDateKey(date, period) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (period) {
    case 'today':
      return `${year}-${month}-${day}`;
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekYear = weekStart.getFullYear();
      const weekMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
      const weekDay = String(weekStart.getDate()).padStart(2, '0');
      return `week-${weekYear}-${weekMonth}-${weekDay}`;
    case 'month':
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

export default function SalesTab({ orders }) {
  const [period, setPeriod] = useState('today');
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 집계 데이터 불러오기
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const dateKey = getDateKey(now, period);
        
        // sales_summary 컬렉션에서 해당 기간의 집계 데이터 조회
        const summaryQuery = query(
          collection(db, "sales_summary"),
          where("storeId", "==", currentUser.uid),
          where("dateKey", "==", dateKey)
        );
        
        const summarySnapshot = await getDocs(summaryQuery);
        
        if (!summarySnapshot.empty) {
          const summaryDoc = summarySnapshot.docs[0];
          setSalesData(summaryDoc.data());
        } else {
          // 집계 데이터가 없으면 기본값 설정
          setSalesData({
            totalSales: 0,
            orderCount: 0,
            menuSales: {}
          });
        }
      } catch (error) {
        console.error('매출 데이터 불러오기 실패:', error);
        setSalesData({
          totalSales: 0,
          orderCount: 0,
          menuSales: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [currentUser, period]);

  if (loading) {
    return <div style={styles.container}>매출 정보를 불러오는 중...</div>;
  }

  const avgOrderValue = salesData?.orderCount > 0 ? salesData.totalSales / salesData.orderCount : 0;
  const menuSalesArray = Object.entries(salesData?.menuSales || {})
    .sort(([, a], [, b]) => b.total - a.total);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>매출 정보</h3>
        <div style={styles.periodSelector}>
          <button style={styles.periodButton(period === 'today')} onClick={() => setPeriod('today')}>오늘</button>
          <button style={styles.periodButton(period === 'week')} onClick={() => setPeriod('week')}>이번 주</button>
          <button style={styles.periodButton(period === 'month')} onClick={() => setPeriod('month')}>이번 달</button>
        </div>
      </div>

      <div style={styles.cardContainer}>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>총 매출</h4>
          <p style={styles.cardValue}>{salesData?.totalSales?.toLocaleString() || 0}원</p>
        </div>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>주문 건수</h4>
          <p style={styles.cardValue}>{salesData?.orderCount?.toLocaleString() || 0}건</p>
        </div>
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>평균 주문 금액</h4>
          <p style={styles.cardValue}>{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}원</p>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <h4 style={{marginTop: 0}}>메뉴별 판매 순위</h4>
        {menuSalesArray.length === 0 ? (
          <p style={{color: '#64748b', textAlign: 'center'}}>판매 데이터가 없습니다.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>순위</th>
                <th style={styles.th}>메뉴명</th>
                <th style={styles.th}>판매량</th>
                <th style={styles.th}>판매액</th>
              </tr>
            </thead>
            <tbody>
              {menuSalesArray.map(([name, data], index) => (
                <tr key={name}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{name}</td>
                  <td style={styles.td}>{data.quantity.toLocaleString()}개</td>
                  <td style={styles.td}>{data.total.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 