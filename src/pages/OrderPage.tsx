import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Bell, Globe, ShoppingCart, Clock, Minus, Plus, X, Check, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, orderBy, doc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

interface MenuOption {
  id: string;
  name: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  spiceLevel: number;
  category: string;
  description?: string;
  options?: MenuOption[];
  categoryId: string;
  categoryName?: string;
  video?: string;
  rating: number;
  cookTime: number;
  isPopular?: boolean;
  status: string;
  badge?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

const OrderPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { storeName, tableNumber } = useParams<{ storeName: string; tableNumber: string }>();
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('한국어');
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progressPosition, setProgressPosition] = useState({ left: 0, width: 0 });
  
  // Menu detail states
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isMenuDetailOpen, setIsMenuDetailOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [showStarAnimation, setShowStarAnimation] = useState(false);

  // Firebase data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [loading, setLoading] = useState(true);
  const [storeDisplayName, setStoreDisplayName] = useState("오더랜드");
  const [categoryMap, setCategoryMap] = useState<{[key: string]: string}>({});
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [isOpen, setIsOpen] = useState(true);

  // URL 파라미터 디코딩
  const decodedStoreName = storeName ? decodeURIComponent(storeName) : "오더랜드";
  const decodedTableNumber = tableNumber ? 
    decodeURIComponent(tableNumber).replace('table-', '') : "1";

  // localStorage에서 장바구니 데이터 로드
  useEffect(() => {
    const cartKey = `cart-${decodedStoreName}-${decodedTableNumber}`;
    console.log('장바구니 로드 시도:', cartKey);
    
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('로드된 장바구니 데이터:', parsedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('장바구니 데이터 로드 실패:', error);
      }
    } else {
      console.log('저장된 장바구니 데이터 없음');
    }
  }, [decodedStoreName, decodedTableNumber]);

  // 영업시간 체크 함수
  const checkBusinessHours = (hours: BusinessHours) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    const dayMap = {
      0: 'sunday',
      1: 'monday', 
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    
    const today = dayMap[dayOfWeek as keyof typeof dayMap];
    const todayHours = hours[today];
    
    if (!todayHours || todayHours.closed) {
      return false;
    }
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  // Firebase에서 가게 정보와 영업시간 가져오기
  useEffect(() => {
    const settingsRef = doc(db, "settings", "store");
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStoreDisplayName(data.storeName || "오더랜드");
        setBusinessHours(data.businessHours || {});
        setIsOpen(checkBusinessHours(data.businessHours || {}));
      }
    });

    return () => unsubscribeSettings();
  }, []);

  // Firebase에서 메뉴 데이터 가져오기 (판매중지 제외)
  useEffect(() => {
    console.log('메뉴 데이터 로딩 시작...');
    
    // createdAt 필드가 없을 수 있으므로 단순 쿼리 사용
    const menuQuery = query(collection(db, "menus"));
    
    const unsubscribeMenu = onSnapshot(menuQuery, (snapshot) => {
      console.log('메뉴 스냅샷 받음:', snapshot.docs.length, '개 문서');
      
      const menuData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('메뉴 데이터:', doc.id, data);
        
        return {
          id: doc.id,
          name: data.name || '',
          price: data.price || 0,
          image: data.image || '/placeholder.svg',
          spiceLevel: data.spiceLevel || 0,
          category: data.categoryName || '기타',
          description: data.description || '',
          options: data.options || [],
          categoryId: data.categoryId || '',
          categoryName: data.categoryName || '기타',
          video: data.video || '',
          rating: data.rating || 4.5,
          cookTime: data.cookTime || 15,
          isPopular: data.badge === "recommended" || data.badge === "best",
          status: data.status || 'active',
          badge: data.badge || ''
        } as MenuItem;
      }).filter(item => {
        // 클라이언트 사이드에서 필터링: 판매중지, 품절, 재료소진 메뉴 제외
        if (item.status && typeof item.status === 'object') {
          const status = item.status as any;
          const isFiltered = !status.salesStopped && !status.soldOut && !status.ingredientsOut;
          console.log('메뉴 필터링:', item.name, '상태:', status, '표시:', isFiltered);
          return isFiltered;
        }
        console.log('메뉴 필터링:', item.name, '상태: 기본', '표시: true');
        return true;
      });
      
      console.log('필터링된 메뉴:', menuData.length, '개');
      
      // 임시 테스트: 메뉴가 없으면 테스트 메뉴 추가
      if (menuData.length === 0) {
        console.log('메뉴가 없어서 테스트 메뉴 추가');
        const testMenu: MenuItem = {
          id: 'test-menu',
          name: '테스트 메뉴',
          price: 10000,
          image: '/placeholder.svg',
          spiceLevel: 0,
          category: '테스트',
          description: '테스트용 메뉴입니다.',
          categoryId: 'test',
          categoryName: '테스트',
          rating: 4.5,
          cookTime: 15,
          status: 'active'
        };
        menuData.push(testMenu);
      }
      
      setMenuItems(menuData);
      
      // 카테고리는 별도 useEffect에서 처리하므로 여기서는 제거
      
      setLoading(false);
      
      // 메뉴 데이터 로드 후 카테고리 업데이트
      if (Object.keys(categoryMap).length > 0) {
        updateCategoriesFromMenu(menuData, categoryMap);
      }
    }, (error) => {
      console.error('메뉴 데이터 로드 오류:', error);
      setLoading(false);
    });

    return () => unsubscribeMenu();
  }, []);

  // Firebase에서 카테고리 데이터 가져오기
  useEffect(() => {
    console.log('카테고리 데이터 로딩 시작...');
    
    const categoriesQuery = query(collection(db, "categories"));
    
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      console.log('카테고리 스냅샷 받음:', snapshot.docs.length, '개 문서');
      
      const categoryData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('카테고리 데이터:', doc.id, data);
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || ''
        };
      });
      
      console.log('로드된 카테고리:', categoryData);
      
      // 카테고리 매핑 업데이트
      const categoryMapping: {[key: string]: string} = {};
      categoryData.forEach(category => {
        categoryMapping[category.id] = category.name;
      });
      
      // 임시 테스트: 카테고리가 없으면 더미 카테고리 추가
      if (categoryData.length === 0) {
        console.log('카테고리가 없어서 더미 카테고리 추가');
        categoryMapping['dummy1'] = '메인 요리';
        categoryMapping['dummy2'] = '사이드 메뉴';
        categoryMapping['dummy3'] = '음료';
      }
      
      setCategoryMap(categoryMapping);
      
      // 메뉴 데이터가 로드된 후에 카테고리 목록 업데이트
      if (menuItems.length > 0) {
        updateCategoriesFromMenu(menuItems, categoryMapping);
      }
    }, (error) => {
      console.error('카테고리 데이터 로드 오류:', error);
    });

    return () => unsubscribeCategories();
  }, [menuItems]); // menuItems가 변경될 때마다 실행

  // 메뉴 데이터에서 카테고리 목록 업데이트하는 함수
  const updateCategoriesFromMenu = (items: MenuItem[], mapping: {[key: string]: string}) => {
    console.log('메뉴에서 카테고리 업데이트 시작');
    console.log('현재 메뉴 아이템들:', items.map(item => ({ name: item.name, categoryId: item.categoryId, categoryName: item.categoryName })));
    console.log('카테고리 매핑:', mapping);
    
    // 메뉴의 categoryId를 사용해서 실제 카테고리 이름 가져오기
    const menuCategories = new Set<string>();
    
    items.forEach(item => {
      if (item.categoryId && mapping[item.categoryId]) {
        // categoryId로 매핑된 실제 카테고리 이름 사용
        menuCategories.add(mapping[item.categoryId]);
        console.log(`메뉴 "${item.name}"의 카테고리: ${item.categoryId} -> ${mapping[item.categoryId]}`);
      } else if (item.categoryName) {
        // categoryName이 있으면 그대로 사용
        menuCategories.add(item.categoryName);
        console.log(`메뉴 "${item.name}"의 카테고리: ${item.categoryName} (직접 사용)`);
      } else {
        // 기본값
        menuCategories.add('기타');
        console.log(`메뉴 "${item.name}"의 카테고리: 기타 (기본값)`);
      }
    });
    
    const allCategories = ["전체", ...Array.from(menuCategories)];
    console.log('최종 카테고리 목록:', allCategories);
    setCategories(allCategories);
  };

  const filteredMenu = selectedCategory === "전체" 
    ? menuItems 
    : menuItems.filter(item => {
        // 카테고리 매핑을 사용해서 실제 카테고리 이름 확인
        let itemCategoryName = item.categoryName || '기타';
        
        if (item.categoryId && categoryMap[item.categoryId]) {
          itemCategoryName = categoryMap[item.categoryId];
        }
        
        console.log(`필터링: 메뉴 "${item.name}"의 카테고리 "${itemCategoryName}" vs 선택된 카테고리 "${selectedCategory}"`);
        return itemCategoryName === selectedCategory;
      });

  // 필터링 결과 로그
  console.log(`필터링 결과: 선택된 카테고리 "${selectedCategory}", 전체 메뉴 ${menuItems.length}개, 필터된 메뉴 ${filteredMenu.length}개`);

  const addToCart = (item: MenuItem) => {
    console.log('장바구니에 추가 시도:', item.name);
    
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      let newCart;
      
      if (existingItem) {
        newCart = prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        newCart = [...prevCart, { ...item, quantity: 1 }];
      }
      
      // localStorage에 저장
      const cartKey = `cart-${decodedStoreName}-${decodedTableNumber}`;
      console.log('장바구니 저장:', cartKey, newCart);
      localStorage.setItem(cartKey, JSON.stringify(newCart));
      return newCart;
    });
    toast({
      title: "메뉴가 추가되었습니다",
      description: `${item.name}이(가) 장바구니에 추가되었습니다.`,
    });
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const renderSpiceLevel = (level: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <span key={i} className={i < level ? "text-red-500" : "text-gray-300"}>
        🌶️
      </span>
    ));
  };

  const callStaff = async () => {
    toast({
      title: "직원을 호출했습니다",
      description: "잠시만 기다려주세요. 직원이 곧 도착합니다.",
    });
  };

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === '한국어' ? 'English' : '한국어');
    toast({
      title: "언어가 변경되었습니다",
      description: `${currentLanguage === '한국어' ? 'English' : '한국어'}로 변경되었습니다.`,
    });
  };

  // Menu detail functions
  const handleMenuClick = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsMenuDetailOpen(true);
    setShowOptions(false);
    setSelectedOptions({});
  };

  const closeMenuDetail = () => {
    setIsMenuDetailOpen(false);
    setShowOptions(false);
    setSelectedMenuItem(null);
    setSelectedOptions({});
  };

  const handleAddToCartFromDetail = () => {
    if (!selectedMenuItem) return;

    if (selectedMenuItem.options && selectedMenuItem.options.length > 0 && !showOptions) {
      setShowOptions(true);
      return;
    }

    // Show star animation
    setShowStarAnimation(true);
    setTimeout(() => setShowStarAnimation(false), 1000);

    // Add to cart with selected options
    const optionsPrice = Object.entries(selectedOptions).reduce((total, [optionId, quantity]) => {
      const option = selectedMenuItem.options?.find(opt => opt.id === optionId);
      return total + (option ? option.price * quantity : 0);
    }, 0);

    const itemWithOptions = {
      ...selectedMenuItem,
      price: selectedMenuItem.price + optionsPrice
    };

    addToCart(itemWithOptions);
    
    // Close detail after animation
    setTimeout(() => {
      closeMenuDetail();
    }, 1200);
  };

  const updateOptionQuantity = (optionId: string, change: number) => {
    setSelectedOptions(prev => {
      const newQuantity = (prev[optionId] || 0) + change;
      if (newQuantity <= 0) {
        const { [optionId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [optionId]: newQuantity };
    });
  };

  const getTotalPriceWithOptions = () => {
    if (!selectedMenuItem) return 0;
    
    const optionsPrice = Object.entries(selectedOptions).reduce((total, [optionId, quantity]) => {
      const option = selectedMenuItem.options?.find(opt => opt.id === optionId);
      return total + (option ? option.price * quantity : 0);
    }, 0);
    
    return selectedMenuItem.price + optionsPrice;
  };

  // 프로그레스 바 위치 업데이트
  const updateProgressPosition = () => {
    const currentIndex = categories.indexOf(selectedCategory);
    if (containerRef.current && categoryRefs.current[currentIndex]) {
      const container = containerRef.current;
      const button = categoryRefs.current[currentIndex];
      
      if (button) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        
        const left = buttonRect.left - containerRect.left + container.scrollLeft;
        const width = buttonRect.width;
        
        setProgressPosition({ left, width });
      }
    }
  };

  useEffect(() => {
    updateProgressPosition();
  }, [selectedCategory]);

  useEffect(() => {
    const handleResize = () => updateProgressPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOrder = async () => {
    if (cart.length === 0) return;
    
    try {
      // Firebase에 주문 저장
      const orderData = {
        storeName: storeDisplayName,
        tableNumber: decodedTableNumber,
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          categoryName: item.categoryName
        })),
        totalAmount: getTotalPrice(),
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        storeId: 'default',
        orderNumber: `ORDER-${Date.now()}`,
        customerInfo: {
          tableNumber: decodedTableNumber,
          orderTime: new Date().toLocaleString('ko-KR'),
          totalItems: getTotalItems()
        },
        paymentStatus: 'pending',
        orderType: 'table'
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);
      
      toast({
        title: "주문이 접수되었습니다! 🎉",
        description: `주문번호: ${orderData.orderNumber}\n총 ${getTotalPrice().toLocaleString()}원의 주문이 접수되었습니다.\n\n관리자 페이지에서 확인하세요!`,
      });
      
      // 장바구니 비우기
      setCart([]);
      // setIsCartOpen(false); // This state was removed, so this line is removed.
      
    } catch (error) {
      console.error('주문 실패:', error);
      toast({
        title: "주문 실패",
        description: "주문 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF914D] mx-auto"></div>
          <p className="mt-4 text-gray-600">메뉴를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-[#FFF8F5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">현재 영업시간이 아닙니다</h1>
          <p className="text-gray-600">영업시간을 확인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F5] pb-20">
      {/* Top Header - Sticky */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-black text-black">{storeDisplayName}</h1>
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
            {decodedTableNumber}번 테이블
          </div>
        </div>
        <div className="text-base font-semibold text-gray-700">
          {selectedCategory} <span className="text-gray-400">{'>'}</span> <span className="text-[#FF914D]">인기메뉴</span>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-gray-100 px-4 py-4">
        <div 
          ref={containerRef}
          className="flex space-x-3 overflow-x-auto scrollbar-hide mb-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {categories.map((category, index) => (
            <button
              key={category}
              ref={(el) => (categoryRefs.current[index] = el)}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                selectedCategory === category
                  ? 'bg-[#FF914D] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        {/* Dot Indicators */}
        <div className="flex justify-center space-x-2">
          {categories.map((category, index) => (
            <div
              key={category}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-[#FF914D] scale-125 shadow-sm'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-4 py-6">
        {filteredMenu.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ShoppingCart className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">메뉴가 없습니다</h3>
            <p className="text-gray-500">현재 등록된 메뉴가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredMenu.map((item) => (
              <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div onClick={() => handleMenuClick(item)}>
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.badge && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {item.isPopular && (
                        <Badge className="absolute top-2 right-2 bg-[#FF914D] text-white text-xs">
                          인기
                        </Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2">
                        {item.name}
                      </h3>
                      <span className="text-sm font-medium text-gray-900">
                        {item.price.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Fixed Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-50">
        <div className="grid grid-cols-3 gap-3">
          {/* 장바구니 버튼 */}
          <Button 
            onClick={() => navigate(`/order/${decodedStoreName}/table-${decodedTableNumber}/cart`)}
            className="relative bg-gray-500 text-white hover:bg-gray-600 h-16 w-full rounded-xl flex flex-col items-center justify-center space-y-1"
          >
            <ShoppingCart className="w-8 h-8" />
            <span className="text-base font-bold">장바구니</span>
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                {getTotalItems()}
              </Badge>
            )}
          </Button>

          {/* 직원 호출 버튼 */}
          <Button
            onClick={callStaff}
            className="bg-[#FF914D] text-white hover:bg-[#e8823d] h-16 w-full rounded-xl flex flex-col items-center justify-center gap-1"
          >
            <Bell className="w-8 h-8" />
            <span className="text-base font-bold">직원 호출</span>
          </Button>

          {/* 주문 내역 버튼 */}
          <Button
            onClick={() => navigate(`/order/${decodedStoreName}/table-${decodedTableNumber}/order-history`)}
            className="bg-gray-500 text-white hover:bg-gray-600 h-16 w-full rounded-xl flex flex-col items-center justify-center gap-1"
          >
            <Clock className="w-8 h-8" />
            <span className="text-base font-bold">주문 내역</span>
          </Button>
        </div>
      </div>

      {/* Menu Detail Drawer */}
      <Drawer open={isMenuDetailOpen} onOpenChange={setIsMenuDetailOpen}>
        <DrawerContent className="max-h-[80vh]">
          {selectedMenuItem && (
            <>
              {/* Menu Detail - Step 1 */}
              {!showOptions && (
                <>
                  <DrawerHeader>
                    <DrawerTitle className="sr-only">
                      {selectedMenuItem.name} 상세 정보
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="relative h-[60%]">
                    <img
                      src={selectedMenuItem.image || '/placeholder.svg'}
                      alt={selectedMenuItem.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={closeMenuDetail}
                      className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="p-6 h-[40%] flex flex-col">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedMenuItem.name}
                      </h2>
                      <p className="text-3xl font-bold text-[#FF914D] mb-4">
                        ₩{selectedMenuItem.price.toLocaleString()}
                      </p>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        {selectedMenuItem.description}
                      </p>
                      {selectedMenuItem.spiceLevel > 0 && (
                        <div className="flex items-center space-x-2 mb-4">
                          <span className="text-sm font-medium text-gray-700">매운맛:</span>
                          {renderSpiceLevel(selectedMenuItem.spiceLevel)}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleAddToCartFromDetail}
                      className="w-full bg-[#FF914D] hover:bg-[#e8823d] text-white h-14 text-lg font-bold rounded-xl"
                    >
                      {selectedMenuItem.options && selectedMenuItem.options.length > 0
                        ? '옵션 선택하기'
                        : '🛒 장바구니에 담기'
                      }
                    </Button>
                  </div>
                </>
              )}

              {/* Options Selection - Step 2 */}
              {showOptions && selectedMenuItem.options && (
                <>
                  <DrawerHeader>
                    <DrawerTitle className="text-xl font-bold">
                      {selectedMenuItem.name} - 옵션 선택
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="px-6 pb-6 flex-1 overflow-y-auto">
                    <div className="space-y-4 mb-6">
                      {selectedMenuItem.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {option.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {option.price > 0 ? `+₩${option.price.toLocaleString()}` : '무료'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOptionQuantity(option.id, -1)}
                              disabled={!selectedOptions[option.id]}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-semibold min-w-[20px] text-center">
                              {selectedOptions[option.id] || 0}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOptionQuantity(option.id, 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            {selectedOptions[option.id] > 0 && (
                              <Check className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">총 금액</span>
                        <span className="text-xl font-bold text-[#FF914D]">
                          ₩{getTotalPriceWithOptions().toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleAddToCartFromDetail}
                      className="w-full bg-[#FF914D] hover:bg-[#e8823d] text-white h-14 text-lg font-bold rounded-xl"
                    >
                      🛒 장바구니에 추가
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Star Animation Overlay */}
      {showStarAnimation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <Star className="w-16 h-16 text-yellow-400 fill-current animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;