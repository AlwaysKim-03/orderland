import { View, Text, Pressable, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: any;
  rightIcon?: any;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  showBack?: boolean;
}

export function MobileHeader({
  title,
  subtitle,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onLeftClick,
  onRightClick,
  showBack = false 
}: MobileHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {showBack && (
          <Pressable onPress={onLeftClick} style={styles.backButton}>
            <ArrowLeft size={24} color="#8a8a8a" />
          </Pressable>
        )}
        {LeftIcon && !showBack && (
          <Pressable onPress={onLeftClick} style={styles.iconButton}>
            <LeftIcon size={24} color="#8a8a8a" />
          </Pressable>
          )}
      </View>

      {/* Center Section */}
      <View style={styles.centerSection}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
          {RightIcon && (
          <Pressable onPress={onRightClick} style={styles.iconButton}>
            <RightIcon size={24} color="#e67e22" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626', // 원본: hsl(15 8% 25%)
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    textAlign: 'center',
    marginTop: 2,
  },
});