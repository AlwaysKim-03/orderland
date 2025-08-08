import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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
    <View style={styles.container}>
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <Pressable onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </Pressable>
      </View>

      {/* Slide Content */}
      <View style={styles.content}>
        <View style={styles.slideContent}>
          {/* Icon */}
          <Text style={styles.icon}>{slides[currentSlide].icon}</Text>

          {/* Headline */}
          <Text style={styles.headline}>
            {slides[currentSlide].headline}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {slides[currentSlide].description}
          </Text>
        </View>
      </View>

      {/* Page Indicators */}
      <View style={styles.indicators}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentSlide && styles.activeIndicator
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        <View style={styles.buttonContainer}>
          {currentSlide > 0 && (
            <Pressable onPress={handlePrevious} style={styles.button}>
              <Text style={styles.buttonText}>이전</Text>
            </Pressable>
          )}
          
          <Pressable 
            onPress={handleNext} 
            style={[styles.button, styles.primaryButton]}
          >
            <Text style={styles.primaryButtonText}>
              {isLastSlide ? "시작하기" : "다음"}
            </Text>
            <ChevronRight size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // 원본: hsl(0 0% 100%)
  },
  skipContainer: {
    alignItems: 'flex-end',
    padding: 16,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#8a8a8a', // 원본: hsl(25 15% 55%)
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#404040', // 원본: hsl(25 25% 15%)
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#8a8a8a', // 원본: hsl(25 15% 55%)
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e6e6e6', // 원본: hsl(25 8% 96%)
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#ff6b35', // 원본: hsl(25 95% 53%) - 따뜻한 오렌지
  },
  navigation: {
    padding: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 20% 90%)
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#ff6b35', // 원본: hsl(25 95% 53%) - 따뜻한 오렌지
    borderColor: '#ff6b35',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    color: '#8a8a8a', // 원본: hsl(25 15% 55%)
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});