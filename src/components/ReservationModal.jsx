import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '../firebase';
import { addDoc, updateDoc, doc, collection } from 'firebase/firestore';

export default function ReservationModal({ 
  isOpen, 
  onClose, 
  reservation = null, 
  storeId,
  onSuccess 
}) {
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    partySize: 1,
    tableNumber: '',
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (reservation) {
      setForm({
        customerName: reservation.customerName || '',
        phone: reservation.phone || '',
        email: reservation.email || '',
        date: reservation.date || '',
        time: reservation.time || '',
        partySize: reservation.partySize || 1,
        tableNumber: reservation.tableNumber || '',
        specialRequests: reservation.specialRequests || ''
      });
    } else {
      // 새 예약일 때 기본값 설정
      setForm({
        customerName: '',
        phone: '',
        email: '',
        date: new Date().toISOString().split('T')[0],
        time: '18:00',
        partySize: 1,
        tableNumber: '',
        specialRequests: ''
      });
    }
  }, [reservation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reservationData = {
        ...form,
        storeId,
        status: reservation ? reservation.status : 'confirmed', // 새 예약은 기본적으로 승인
        createdAt: reservation ? reservation.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (reservation) {
        // 수정
        await updateDoc(doc(db, "reservations", reservation.id), reservationData);
      } else {
        // 새 예약 추가
        await addDoc(collection(db, "reservations"), reservationData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('예약 저장 실패:', error);
      alert('예약 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {reservation ? '예약 수정' : '새 예약 추가'}
          </DialogTitle>
          <DialogDescription>
            고객 예약 정보를 입력하세요
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">고객명 *</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">날짜 *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">시간 *</Label>
              <Input
                id="time"
                type="time"
                value={form.time}
                onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partySize">인원 *</Label>
              <Select
                value={form.partySize.toString()}
                onValueChange={(value) => setForm(prev => ({ ...prev, partySize: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}명
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tableNumber">테이블 번호</Label>
              <Input
                id="tableNumber"
                value={form.tableNumber}
                onChange={(e) => setForm(prev => ({ ...prev, tableNumber: e.target.value }))}
                placeholder="예: 테이블 4"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specialRequests">요청사항</Label>
            <Textarea
              id="specialRequests"
              value={form.specialRequests}
              onChange={(e) => setForm(prev => ({ ...prev, specialRequests: e.target.value }))}
              placeholder="창가 자리, 생일 축하 등 특별한 요청사항이 있다면 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : (reservation ? '수정' : '추가')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 