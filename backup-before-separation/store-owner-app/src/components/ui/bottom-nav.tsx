import { View, Pressable, Text, StyleSheet } from "react-native";
import { LucideIcon } from "lucide-react";

interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  isActive?: boolean;
}

interface BottomNavProps {
  items: BottomNavItem[];
  onItemClick: (id: string) => void;
}

export function BottomNav({ items, onItemClick }: BottomNavProps) {
  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onItemClick(item.id)}
            style={[
              styles.navItem,
              item.isActive && styles.navItemActive
            ]}
          >
            <View style={styles.navIcon}>
              <item.icon
                size={24}
                color={item.isActive ? '#ffffff' : '#8a8a8a'} // 원본: hsl(25 15% 55%)
              />
              {item.badge && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                  {item.badge > 99 ? "99+" : item.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.navLabel,
              item.isActive && styles.navLabelActive
            ]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    paddingBottom: 20, // Safe area for devices with home indicator
    paddingTop: 8,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state styling
  },
  navIcon: {
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#e67e22', // 원본: hsl(15 85% 58%) - 새로운 따뜻한 오렌지
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#ef4444', // 원본: hsl(0 70% 60%)
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});