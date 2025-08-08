import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Progress } from "../ui/progress";

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
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>
        <Text style={styles.title}>오더랜드</Text>
        <Text style={styles.subtitle}>OrderLand</Text>
      </View>

      {/* Loading Animation */}
      <View style={styles.progressContainer}>
        <Progress 
          value={progress} 
          style={styles.progress}
        />
      </View>

      {/* Loading Message */}
      {showMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            {message}
          </Text>
        </View>
      )}

      {/* Spinning plate animation */}
      <View style={styles.spinnerContainer}>
        <View style={styles.spinner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  logoIcon: {
    width: 96,
    height: 96,
    marginBottom: 24,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 32,
  },
  progress: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageContainer: {
    alignItems: 'center',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  spinnerContainer: {
    position: 'absolute',
    bottom: 80,
    opacity: 0.1,
  },
  spinner: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
  },
});