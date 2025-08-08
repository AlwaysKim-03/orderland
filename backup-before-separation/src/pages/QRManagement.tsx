import { useState } from "react";
import { ArrowLeft, QrCode, Download, Eye, Plus, RotateCcw, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface QRManagementProps {
  onBack: () => void;
}

interface Table {
  id: number;
  name: string;
  qrCodeUrl: string;
}

export default function QRManagement({ onBack }: QRManagementProps) {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [downloadFormat, setDownloadFormat] = useState("png");
  const [resetQRPositions, setResetQRPositions] = useState(false);

  // Mock table data - in real app this would come from backend
  const tables: Table[] = [
    { id: 1, name: "테이블 1번", qrCodeUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDAwIi8+PC9zdmc+" },
    { id: 2, name: "테이블 2번", qrCodeUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDAwIi8+PC9zdmc+" },
    { id: 3, name: "테이블 3번", qrCodeUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDAwIi8+PC9zdmc+" },
    { id: 4, name: "테이블 4번", qrCodeUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDAwIi8+PC9zdmc+" },
    { id: 5, name: "테이블 5번", qrCodeUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDAwIi8+PC9zdmc+" },
    { id: 6, name: "테이블 6번", qrCodeUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMDAwIi8+PC9zdmc+" }
  ];

  const handleDownload = (table: Table) => {
    setSelectedTable(table);
    setDownloadModalOpen(true);
  };

  const handlePreview = (table: Table) => {
    setSelectedTable(table);
    setPreviewModalOpen(true);
  };

  const handleDownloadConfirm = () => {
    if (!selectedTable) return;

    // Mock download functionality
    toast({
      title: "QR 코드 다운로드 완료",
      description: `${selectedTable.name} QR 코드가 ${downloadFormat.toUpperCase()} 형식으로 다운로드되었습니다.`,
    });

    setDownloadModalOpen(false);
    setSelectedTable(null);
  };

  const handleResetPositions = (enabled: boolean) => {
    setResetQRPositions(enabled);
    toast({
      title: "설정 변경",
      description: `테이블 QR 위치 초기화가 ${enabled ? '활성화' : '비활성화'}되었습니다.`,
    });
  };

  const handleRegenerateAll = () => {
    toast({
      title: "QR 코드 재발급 요청",
      description: "전체 QR 코드 재발급 기능은 백엔드 연동 후 사용 가능합니다.",
    });
  };

  const handleAddTable = () => {
    toast({
      title: "테이블 추가",
      description: "테이블 추가 기능은 백엔드 연동 후 사용 가능합니다.",
    });
  };

  // Empty state when no tables
  if (tables.length === 0) {
    return (
      <div className="min-h-screen bg-background">
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
              <h1 className="text-xl font-bold">테이블 & QR 코드</h1>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <QrCode className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">등록된 테이블이 없습니다</h3>
              <p className="text-muted-foreground">
                테이블을 추가하여 QR 코드를 생성해보세요
              </p>
            </div>
            <Button onClick={handleAddTable} className="gap-2">
              <Plus className="h-4 w-4" />
              테이블 추가하러 가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold">테이블 & QR 코드</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6 pb-24 space-y-6">
        {/* Table List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">등록된 테이블</h2>
          <div className="grid gap-4">
            {tables.map((table) => (
              <Card key={table.id} className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* QR Code Thumbnail */}
                    <div className="shrink-0">
                      <div className="w-16 h-16 bg-white border rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={table.qrCodeUrl} 
                          alt={`${table.name} QR`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Table Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{table.name}</h3>
                      <p className="text-sm text-muted-foreground">주문용 QR 코드</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(table)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        미리보기
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(table)}
                        className="gap-1"
                      >
                        <Download className="h-4 w-4" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Settings */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold">추가 설정</h3>
            
            {/* Reset QR Positions Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-primary" />
                <div>
                  <Label className="font-medium">테이블 QR 위치 초기화</Label>
                  <p className="text-sm text-muted-foreground">QR 코드 스캔 위치를 기본값으로 설정</p>
                </div>
              </div>
              <Switch
                checked={resetQRPositions}
                onCheckedChange={handleResetPositions}
              />
            </div>

            {/* Regenerate All QR Codes */}
            <div className="pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <RefreshCw className="h-4 w-4" />
                    전체 QR 재발급
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90%] max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>QR 코드 재발급 확인</AlertDialogTitle>
                    <AlertDialogDescription>
                      모든 테이블의 QR 코드를 새로 발급하시겠습니까? 
                      기존 QR 코드는 더 이상 사용할 수 없게 됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerateAll}>
                      재발급
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Download Modal */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle>QR 코드 다운로드</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedTable && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-12 h-12 bg-white border rounded flex items-center justify-center">
                  <img 
                    src={selectedTable.qrCodeUrl} 
                    alt={`${selectedTable.name} QR`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-medium">{selectedTable.name}</p>
                  <p className="text-sm text-muted-foreground">다운로드할 QR 코드</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Label className="text-base font-medium">다운로드 형식</Label>
              <RadioGroup value={downloadFormat} onValueChange={setDownloadFormat}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="png" id="png" />
                  <Label htmlFor="png" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">PNG 이미지</p>
                      <p className="text-sm text-muted-foreground">화질 선명, 웹 및 모바일 최적화</p>
                    </div>
                  </Label>
                  <Zap className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">PDF 문서</p>
                      <p className="text-sm text-muted-foreground">인쇄용, 고해상도 벡터 형식</p>
                    </div>
                  </Label>
                  <QrCode className="h-4 w-4 text-blue-500" />
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setDownloadModalOpen(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button 
                onClick={handleDownloadConfirm}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                다운로드
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="w-[95%] max-w-lg">
          <DialogHeader>
            <DialogTitle>QR 코드 미리보기</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-medium text-lg">{selectedTable.name}</p>
                <p className="text-sm text-muted-foreground">주문용 QR 코드</p>
              </div>
              
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-white border rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={selectedTable.qrCodeUrl} 
                    alt={`${selectedTable.name} QR`}
                    className="w-full h-full object-contain cursor-zoom-in"
                  />
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>고객이 스마트폰으로 스캔하여 주문할 수 있습니다</p>
                <p>이미지를 터치하여 확대할 수 있습니다</p>
              </div>

              <Button 
                onClick={() => setPreviewModalOpen(false)}
                className="w-full"
              >
                닫기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}