import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChefHat, UserCheck } from "lucide-react";

interface UserTypeSelectionProps {
  onOwnerSelect: () => void;
  onOrderStatus: () => void;
}

export function UserTypeSelection({ onOwnerSelect, onOrderStatus }: UserTypeSelectionProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.title}>오더랜드에 오신 것을 환영합니다!</Text>
        <Text style={styles.subtitle}>
          어떤 서비스를 이용하시나요?
        </Text>
      </View>

      {/* User Type Cards */}
      <View style={styles.cardsContainer}>
        {/* Owner Card */}
        <Pressable 
          style={styles.card}
          onPress={onOwnerSelect}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <ChefHat size={32} color="#ffffff" />
            </View>
            <Text style={styles.cardTitle}>🧑‍🍳 사장님용</Text>
            <Text style={styles.cardDescription}>
              사장님이신가요?{'\n'}
              지금 바로 스마트한 주문 관리를 시작하세요!
            </Text>
          </View>
        </Pressable>

        {/* Order Status Card */}
        <Pressable 
          style={styles.card}
          onPress={onOrderStatus}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, styles.secondaryIcon]}>
              <UserCheck size={32} color="#8a8a8a" />
            </View>
            <Text style={styles.cardTitle}>📋 주문 현황</Text>
            <Text style={styles.cardDescription}>
              바로 주문 현황을{'\n'}
              확인하고 관리하세요!
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Footer Note */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          언제든지 다른 모드로 전환할 수 있어요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // 원본: hsl(0 0% 100%)
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#404040', // 원본: hsl(25 25% 15%)
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#8a8a8a', // 원본: hsl(25 15% 55%)
  },
  cardsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff', // 원본: hsl(0 0% 100%)
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e6e6e6', // 원본: hsl(25 20% 90%)
  },
  cardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff6b35', // 원본: hsl(25 95% 53%) - 따뜻한 오렌지
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  secondaryIcon: {
    backgroundColor: '#f5f5f5', // 원본: hsl(25 10% 95%)
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#404040', // 원본: hsl(25 25% 15%)
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: '#8a8a8a', // 원본: hsl(25 15% 55%)
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(25 15% 55%)
  },
});