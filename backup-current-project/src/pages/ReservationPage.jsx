import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, Phone, Mail, MapPin, CheckCircle } from "lucide-react";
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default function ReservationPage() {
  const { storeSlug } = useParams();
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    partySize: 2,
    specialRequests: ''
  });

  // 가게 정보 가져오기
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const storeName = decodeURIComponent(storeSlug).replace(/-/g, ' ');
        const q = query(collection(db, "users"), where("store_name", "==", storeName));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const storeData = snapshot.docs[0].data();
          setStoreInfo({
            id: snapshot.docs[0].id,
            ...storeData
          });
        }
      } catch (error) {
        console.error('가게 정보 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, [storeSlug]);

  // 최소 날짜 설정 (오늘부터)
  const minDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const reservationData = {
        ...form,
        storeId: storeInfo.id,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, "reservations"), reservationData);
      setSuccess(true);
    } catch (error) {
      console.error('예약 제출 실패:', error);
      alert('예약 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">가게 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!storeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">가게를 찾을 수 없습니다</h1>
          <p className="text-gray-600">URL을 확인해주세요.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">예약이 완료되었습니다!</h2>
            <p className="text-gray-600 mb-6">
              {storeInfo.store_name}에서 예약을 확인한 후 연락드리겠습니다.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold mb-2">예약 정보</h3>
              <p><strong>가게:</strong> {storeInfo.store_name}</p>
              <p><strong>고객명:</strong> {form.customerName}</p>
              <p><strong>날짜:</strong> {form.date}</p>
              <p><strong>시간:</strong> {form.time}</p>
              <p><strong>인원:</strong> {form.partySize}명</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {storeInfo.store_name}
            </CardTitle>
            <CardDescription>
              테이블 예약을 도와드리겠습니다
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 고객 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">고객 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">이름 *</Label>
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
                      placeholder="010-1234-5678"
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
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              {/* 예약 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">예약 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">날짜 *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                      min={minDate}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">시간 *</Label>
                    <Select
                      value={form.time}
                      onValueChange={(value) => setForm(prev => ({ ...prev, time: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="시간 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return `${hour}:00`;
                        }).map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                  <Label htmlFor="specialRequests">요청사항</Label>
                  <Textarea
                    id="specialRequests"
                    value={form.specialRequests}
                    onChange={(e) => setForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="창가 자리, 생일 축하, 특별한 요청사항이 있다면 입력해주세요"
                    rows={3}
                  />
                </div>
              </div>

              {/* 제출 버튼 */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={submitting}
              >
                {submitting ? '예약 제출 중...' : '예약하기'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 