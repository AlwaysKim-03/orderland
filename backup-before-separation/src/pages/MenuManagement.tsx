import { useState } from "react";
import { MobileHeader } from "@/components/ui/mobile-header";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Edit, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
        return <Badge className="bg-success text-success-foreground">판매중</Badge>;
      case "sold-out":
        return <Badge className="bg-warning text-warning-foreground">품절</Badge>;
      case "unavailable":
        return <Badge variant="secondary">판매중지</Badge>;
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

  // Empty state when no menu items
  if (menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <MobileHeader
          title="메뉴 관리"
          rightIcon={Plus}
          onRightClick={() => {}}
        />
        
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="text-8xl mb-6">🍽️</div>
          <h2 className="mobile-title mb-3">메뉴를 추가해보세요!</h2>
          <p className="mobile-body text-muted-foreground text-center mb-8 max-w-sm">
            첫 번째 메뉴를 등록하고 고객들에게 맛있는 음식을 소개해보세요
          </p>
          
          <div className="space-y-3 w-full max-w-sm">
            <Button className="w-full" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              첫 메뉴 추가하기
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              카테고리 추가하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader
        title="메뉴 관리"
        subtitle={`총 ${menuItems.length}개 메뉴`}
        rightIcon={Plus}
        onRightClick={() => {}}
      />

      {/* Search and Filter */}
      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="메뉴 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items List */}
      <div className="px-4 space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-start space-x-3">
              {/* Menu Image/Icon */}
              <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center text-2xl shrink-0">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  getDefaultIcon(item.category)
                )}
              </div>

              {/* Menu Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="mobile-subtitle truncate">{item.name}</h3>
                    {item.isRecommended && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        추천
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="mobile-subtitle text-primary">
                    {item.price.toLocaleString()}원
                  </span>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty Filter State */}
      {filteredItems.length === 0 && menuItems.length > 0 && (
        <div className="text-center px-6 py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="mobile-subtitle text-muted-foreground mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="mobile-caption">
            다른 키워드로 검색해보세요
          </p>
        </div>
      )}

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg"
        onClick={() => {}}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}