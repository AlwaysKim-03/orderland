import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  onComplete: () => void;
}

const loadingMessages = [
  "오늘도 맛있는 주문을 준비 중이에요!",
  "사장님, 잠시만 기다려 주세요 :)",
  "스마트한 매장 관리를 준비하고 있어요!",
  "QR 주문 시스템을 불러오는 중..."
];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Show message after 3 seconds
    const messageTimeout = setTimeout(() => {
      setShowMessage(true);
      setMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(messageTimeout);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen gradient-primary flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white/20 flex items-center justify-center">
          <div className="text-4xl">🍽️</div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">오더랜드</h1>
        <p className="text-white/80 text-lg">OrderLand</p>
      </div>

      {/* Loading Animation */}
      <div className="w-full max-w-xs mb-8">
        <Progress 
          value={progress} 
          className="h-2 bg-white/20"
        />
      </div>

      {/* Loading Message */}
      {showMessage && (
        <div className="text-center animate-fade-in">
          <p className="text-white/90 text-base leading-relaxed max-w-sm">
            {message}
          </p>
        </div>
      )}

      {/* Spinning plate animation */}
      <div className="absolute bottom-20 opacity-10">
        <div className="w-32 h-32 rounded-full border-4 border-white animate-spin border-t-transparent"></div>
      </div>
    </div>
  );
}