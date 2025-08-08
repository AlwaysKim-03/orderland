import { useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView, FlatList } from "react-native";
import { Plus, Search, Filter, Edit, MoreVertical } from "lucide-react";
import { MobileHeader } from "../components/ui/mobile-header";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  status: "available" | "sold-out" | "unavailable";
  isRecommended: boolean;
}

const mockMenuItems: MenuItem[] = [
  {
    id: "1",
    name: "김치찌개",
    description: "집에서 만든 묵은지로 끓인 진짜 김치찌개",
    price: 9000,
    category: "찌개류",
    status: "available",
    isRecommended: true
  },
  {
    id: "2", 
    name: "제육볶음",
    description: "매콤달콤한 제육볶음과 상추쌈",
    price: 13000,
    category: "볶음류",
    status: "sold-out",
    isRecommended: false
  },
  {
    id: "3",
    name: "된장찌개",
    description: "집된장으로 끓인 구수한 된장찌개",
    price: 8000,
    category: "찌개류", 
    status: "available",
    isRecommended: false
  }
];

const categories = ["전체", "찌개류", "볶음류", "구이류", "면류"];

export default function MenuManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [menuItems, setMenuItems] = useState(mockMenuItems);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "전체" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: MenuItem["status"]) => {
    switch (status) {
      case "available":
        return (
          <View style={styles.statusBadgeSuccess}>
            <Text style={styles.statusBadgeTextSuccess}>판매중</Text>
          </View>
        );
      case "sold-out":
        return (
          <View style={styles.statusBadgeWarning}>
            <Text style={styles.statusBadgeTextWarning}>품절</Text>
          </View>
        );
      case "unavailable":
        return (
          <View style={styles.statusBadgeSecondary}>
            <Text style={styles.statusBadgeTextSecondary}>판매중지</Text>
          </View>
        );
    }
  };

  const getDefaultIcon = (category: string) => {
    const icons = {
      "찌개류": "🍲",
      "볶음류": "🍳", 
      "구이류": "🥩",
      "면류": "🍜",
      "밥류": "🍚"
    };
    return icons[category as keyof typeof icons] || "🍽️";
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemHeader}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <View style={styles.menuItemMeta}>
            <Text style={styles.menuItemPrice}>{item.price.toLocaleString()}원</Text>
            <Text style={styles.menuItemCategory}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.menuItemActions}>
          {getStatusBadge(item.status)}
          <Pressable style={styles.actionButton}>
            <MoreVertical size={16} color="#8a8a8a" />
          </Pressable>
        </View>
      </View>
      {item.isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>추천메뉴</Text>
        </View>
      )}
    </View>
  );

  // Empty state when no menu items
  if (menuItems.length === 0) {
    return (
      <View style={styles.container}>
        <MobileHeader
          title="메뉴 관리"
          rightIcon={Plus}
          onRightClick={() => {}}
        />
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>메뉴를 추가해보세요!</Text>
          <Text style={styles.emptyDescription}>
            첫 번째 메뉴를 등록하고 고객들에게 맛있는 음식을 소개해보세요
          </Text>
          
          <Pressable style={styles.addButton}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>메뉴 추가하기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MobileHeader
        title="메뉴 관리"
        rightIcon={Plus}
        onRightClick={() => {}}
      />

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#8a8a8a" />
          <TextInput
            style={styles.searchInput}
            placeholder="메뉴 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable style={styles.filterButton}>
          <Filter size={20} color="#e67e22" />
        </Pressable>
      </View>

        {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
          {categories.map((category) => (
          <Pressable
              key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.categoryButtonTextActive
            ]}>
              {category}
            </Text>
          </Pressable>
          ))}
      </ScrollView>

      {/* Menu List */}
      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        style={styles.menuList}
        contentContainerStyle={styles.menuListContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe', // 원본: hsl(32 100% 98%)
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%)
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#262626', // 원본: hsl(15 8% 25%)
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    borderRadius: 8,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryContent: {
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
    borderRadius: 20,
  },
  categoryButtonActive: {
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%)
    borderColor: '#e67e22', // 원본: hsl(15 85% 58%)
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
  },
  categoryButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  menuList: {
    flex: 1,
  },
  menuListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6', // 원본: hsl(25 30% 90%)
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626', // 원본: hsl(15 8% 25%)
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    marginBottom: 8,
    lineHeight: 20,
  },
  menuItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e67e22', // 원본: hsl(15 85% 58%)
  },
  menuItemCategory: {
    fontSize: 12,
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    backgroundColor: '#f5f5f5', // 원본: hsl(25 20% 96%)
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  statusBadgeSuccess: {
    backgroundColor: '#22c55e', // 원본: hsl(142 70% 50%)
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextSuccess: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadgeWarning: {
    backgroundColor: '#eab308', // 원본: hsl(45 90% 55%)
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextWarning: {
    color: '#262626', // 원본: hsl(15 8% 25%)
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadgeSecondary: {
    backgroundColor: '#f5f5f5', // 원본: hsl(25 20% 96%)
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeTextSecondary: {
    color: '#8a8a8a', // 원본: hsl(15 5% 55%)
    fontSize: 12,
    fontWeight: '500',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#e67e22', // 원본: hsl(15 85% 58%)
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
});