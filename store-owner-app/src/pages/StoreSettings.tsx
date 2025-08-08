import { useState } from "react";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "../hooks/use-toast";

interface StoreSettingsProps {
  onBack: () => void;
}

export default function StoreSettings({ onBack }: StoreSettingsProps) {
  const [storeName, setStoreName] = useState("마마돈까스");
  const [phoneNumber, setPhoneNumber] = useState("010-1234-5678");
  const [address, setAddress] = useState("서울시 강남구 테헤란로 123길 45");
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [closedDays, setClosedDays] = useState<string[]>([]);

  const weekdays = [
    { id: "monday", label: "월" },
    { id: "tuesday", label: "화" },
    { id: "wednesday", label: "수" },
    { id: "thursday", label: "목" },
    { id: "friday", label: "금" },
    { id: "saturday", label: "토" },
    { id: "sunday", label: "일" }
  ];

  const handleClosedDayToggle = (dayId: string) => {
    setClosedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleAddressSearch = () => {
    toast({
      title: "주소 검색",
      description: "카카오 주소 API 연동 예정입니다.",
    });
  };

  const handleSave = () => {
    if (!storeName.trim() || !phoneNumber.trim() || !address.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "저장 완료",
      description: "매장 정보가 저장되었습니다.",
    });
  };

  const isFormValid = storeName.trim() && phoneNumber.trim() && address.trim();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">매장 정보</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 pb-24 space-y-6">
        {/* Store Name */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Label htmlFor="store-name" className="text-base font-semibold">
              매장 이름 *
            </Label>
            <Input
              id="store-name"
              placeholder="예: 마마돈까스"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* Phone Number */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Label htmlFor="phone" className="text-base font-semibold">
              매장 전화번호 *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="예: 010-1234-5678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-base"
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Label className="text-base font-semibold">주소 *</Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="주소를 검색해주세요"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-base flex-1"
                  readOnly
                />
                <Button 
                  variant="outline" 
                  onClick={handleAddressSearch}
                  className="shrink-0 px-4"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  주소 검색
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Label className="text-base font-semibold">영업시간</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="open-time" className="text-sm text-muted-foreground">
                  오픈 시간
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="open-time"
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="close-time" className="text-sm text-muted-foreground">
                  마감 시간
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="close-time"
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="pl-10 text-base"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Closed Days */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Label className="text-base font-semibold">정기 휴무일</Label>
            <div className="grid grid-cols-7 gap-2">
              {weekdays.map((day) => (
                <div key={day.id} className="flex flex-col items-center space-y-2">
                  <Checkbox
                    id={day.id}
                    checked={closedDays.includes(day.id)}
                    onCheckedChange={() => handleClosedDayToggle(day.id)}
                    className="h-5 w-5"
                  />
                  <Label 
                    htmlFor={day.id} 
                    className={`text-sm cursor-pointer ${
                      closedDays.includes(day.id) ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            {closedDays.length > 0 && (
              <p className="text-xs text-muted-foreground">
                선택된 휴무일: {closedDays.map(id => weekdays.find(d => d.id === id)?.label).join(', ')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <Button 
          onClick={handleSave}
          disabled={!isFormValid}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          저장하기
        </Button>
      </div>
    </div>
  );
}