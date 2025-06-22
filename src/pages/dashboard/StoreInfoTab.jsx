import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { FaCog } from 'react-icons/fa';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';

function toSlug(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, '-');
}

export default function StoreInfoTab({ userInfo, onStoreUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    store_name: '',
    phone: '',
    tableCount: 1
  });
  
  // userInfo가 업데이트되면 form 상태를 동기화
  useEffect(() => {
    if (userInfo) {
        setForm({
        store_name: userInfo.store_name || '',
        phone: userInfo.phone || '',
        tableCount: userInfo.tableCount || 1
        });
    }
  }, [userInfo]);

  const handleUpdate = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return alert('로그인이 필요합니다.');
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        store_name: form.store_name,
        phone: form.phone,
        tableCount: Number(form.tableCount) || 1
      });
      alert('가게 정보가 성공적으로 수정되었습니다.');
      setEditing(false);
      if (onStoreUpdate) {
        onStoreUpdate(); // 부모 컴포넌트에 데이터 리프레시 요청
      }
    } catch (err) {
      console.error('가게 정보 수정 실패:', err);
      alert('수정에 실패했습니다: ' + err.message);
    }
  };

  const storeSlug = useMemo(() => {
    if (!form.store_name) return '';
    return encodeURIComponent(toSlug(form.store_name));
  }, [form.store_name]);

  const tableUrls = useMemo(() => {
    if (!storeSlug || !form.tableCount) return [];
    return Array.from({ length: form.tableCount }, (_, i) =>
      `${window.location.origin}/order/${storeSlug}/table-${i + 1}`
    );
  }, [storeSlug, form.tableCount]);

  const handleDownload = (index) => {
    const canvas = document.getElementById(`qr-canvas-${index}`);
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${storeSlug}-table-${index + 1}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else {
      console.error('QR 코드 캔버스를 찾을 수 없습니다.');
    }
  };

  if (!userInfo) {
    return <div>가게 정보를 불러오는 중...</div>;
  }
  
  return (
    <div style={{ padding: 20 }}>
      <h3>
        가게 정보 <button onClick={() => setEditing(!editing)}><FaCog /> {editing ? '취소' : '수정'}</button>
      </h3>

      {editing ? (
        <div>
          <label>가게명: <input value={form.store_name} onChange={(e) => setForm(prev => ({ ...prev, store_name: e.target.value }))} /></label><br />
          <label>전화번호: <input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} /></label><br />
          <label>테이블 수: <input type="number" value={form.tableCount} onChange={(e) => setForm(prev => ({ ...prev, tableCount: e.target.value }))} /></label><br />
          <button onClick={handleUpdate}>저장하기</button>
        </div>
      ) : (
        <div>
          <p><strong>가게명:</strong> {userInfo.store_name}</p>
          <p><strong>전화번호:</strong> {userInfo.phone}</p>
          <p><strong>테이블 수:</strong> {userInfo.tableCount}</p>
        </div>
      )}

      <hr style={{margin: '20px 0'}}/>

      <h3>테이블별 주문 QR 코드</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tableUrls.map((url, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            border: '1px solid #eee', 
            padding: '12px', 
            borderRadius: '8px' 
          }}>
            <div style={{ flexShrink: 0 }}>
              <QRCodeCanvas
                value={url}
                size={50}
                level={"H"}
                includeMargin={true}
                id={`qr-canvas-${index}`}
              />
            </div>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong style={{ fontSize: '16px' }}>테이블 {index + 1}</strong>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '12px', wordBreak: 'break-all' }}>
                {decodeURIComponent(url)}
              </a>
            </div>
            <button onClick={() => handleDownload(index)} style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                background: '#f8f8f8',
                cursor: 'pointer'
            }}>
              다운로드
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 