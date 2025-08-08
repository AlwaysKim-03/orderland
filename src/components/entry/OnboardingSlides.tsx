import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Rocket } from "lucide-react";

interface OnboardingSlidesProps {
  onComplete: () => void;
  onSkip: () => void;
}

const slides = [
  {
    id: 1,
    headline: "키오스크 없이도 스마트한 주문",
    icon: "📱",
    description: "QR 코드 하나로 손님이 직접 주문할 수 있어요"
  },
  {
    id: 2,
    headline: "QR 하나로 시작하는 운영 혁신",
    icon: "📋",
    description: "주문부터 결제까지 모든 과정이 자동화됩니다"
  },
  {
    id: 3,
    headline: "사장님도 손님도 모두 간단하게",
    icon: "👥",
    description: "복잡한 설정 없이 바로 시작할 수 있어요"
  }
];

export function OnboardingSlides({ onComplete, onSkip }: OnboardingSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Button */}
      <div className="flex justify-end p-4">
        <Button 
          variant="ghost" 
          onClick={onSkip}
          className="text-muted-foreground hover-scale"
        >
          건너뛰기
        </Button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-center max-w-sm">
          {/* Icon */}
          <div className="text-8xl mb-8 bounce-gentle">
            {slides[currentSlide].icon}
          </div>

          {/* Headline */}
          <h2 className="mobile-title mb-4 text-foreground">
            {slides[currentSlide].headline}
          </h2>

          {/* Description */}
          <p className="mobile-body text-muted-foreground leading-relaxed">
            {slides[currentSlide].description}
          </p>
        </div>
      </div>

      {/* Page Indicators */}
      <div className="flex justify-center items-center gap-2 mb-8">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentSlide 
                ? "bg-primary w-6" 
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="p-6">
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              className="flex-1 hover-scale"
            >
              이전
            </Button>
          )}
          
          <Button
            size="lg"
            onClick={handleNext}
            className={`${currentSlide === 0 ? 'flex-1' : 'flex-1'} hover-scale gradient-primary text-white border-0`}
          >
            {isLastSlide ? (
              <>
                시작하기 <Rocket className="ml-2 w-4 h-4" />
              </>
            ) : (
              <>
                다음 <ChevronRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}