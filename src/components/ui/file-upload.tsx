import React, { useState } from "react";
import { Button } from "./button";
import { Upload, X, ImageIcon, Video } from "lucide-react";

interface FileUploadProps {
  onUpload: (url: string) => void;
  onRemove: () => void;
  currentUrl?: string;
  accept?: "image" | "video" | "both";
  className?: string;
}

export function FileUpload({ 
  onUpload, 
  onRemove, 
  currentUrl, 
  accept = "image",
  className = "" 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // FileReader를 사용하여 base64 인코딩된 데이터 URL 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onUpload(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getAcceptTypes = () => {
    switch (accept) {
      case "image":
        return "image/*";
      case "video":
        return "video/*";
      case "both":
        return "image/*,video/*";
      default:
        return "image/*";
    }
  };

  const getIcon = () => {
    if (currentUrl) {
      return accept === "video" ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />;
    }
    return <Upload className="w-4 h-4" />;
  };

  const getText = () => {
    if (currentUrl) {
      return accept === "video" ? "비디오 업로드됨" : "이미지 업로드됨";
    }
    return accept === "video" ? "비디오 업로드" : "이미지 업로드";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {currentUrl ? (
        <div className="relative">
          {accept === "video" ? (
            <video 
              src={currentUrl} 
              className="w-full h-32 object-cover rounded-lg border"
              controls
            />
          ) : (
            <img 
              src={currentUrl} 
              alt="Uploaded file" 
              className="w-full h-32 object-cover rounded-lg border"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            {getIcon()}
            <div>
              <p className="text-sm font-medium">{getText()}</p>
              <p className="text-xs text-muted-foreground">
                클릭하거나 파일을 드래그하여 업로드하세요
              </p>
            </div>
            <input
              type="file"
              accept={getAcceptTypes()}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>파일 선택</span>
              </Button>
            </label>
          </div>
        </div>
      )}
    </div>
  );
} 