import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Globe, ShoppingCart, Clock, Minus, Plus, X, Check, Star, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, orderBy, doc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { NotificationBell } from '@/components/ui/notification-bell';

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
  const { storeName, tableNumber, storeId, tableId } = useParams<{ 
    storeName?: string; 
    tableNumber?: string;
    storeId?: string;
    tableId?: string;
  }>();
  
  // 손님용 페이지에서는 항상 라이트 모드 사용
  useEffect(() => {
    // 다크모드 클래스 제거하여 라이트 모드 강제 적용
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    
    // 페이지 언마운트 시 원래 테마로 복원하지 않음 (손님용 페이지이므로)
  }, []);
  
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('한국어');
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progressPosition, setProgressPosition] = useState({ left: 0, width: 0 });
  const previousMenuItemsRef = useRef<MenuItem[]>([]);
  
  // Menu detail states
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isMenuDetailOpen, setIsMenuDetailOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [showStarAnimation, setShowStarAnimation] = useState(false);
  
  // Staff call states
  const [isStaffCallOpen, setIsStaffCallOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState('');
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [callCooldown, setCallCooldown] = useState(0);

  // Order end states
  const [showGoodbyeScreen, setShowGoodbyeScreen] = useState(false);

  // Notification states
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'staff_call' | 'order_update' | 'system';
    timestamp: Date;
    read: boolean;
  }>>([]);

  // Timer for call cooldown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (callCooldown > 0) {
      interval = setInterval(() => {
        setCallCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callCooldown]);

  // Listen for order end events from admin
  useEffect(() => {
    const handleOrderEnded = (event: CustomEvent) => {
      const { tableId: endedTableId } = event.detail;
      // Check if this is the current table
      if (endedTableId.toString() === tableNumber) {
        // Clear all customer data
        setCart([]);
        localStorage.removeItem('orderland-cart');
        localStorage.removeItem('orderland-order-history');
        
        // Show goodbye screen
        setShowGoodbyeScreen(true);
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          setShowGoodbyeScreen(false);
          // Reset to first category
          setSelectedCategory('전체');
          
          toast({
            title: "새로운 주문을 시작하세요! 🎉",
            description: "언제든지 메뉴를 선택해서 주문해보세요.",
          });
        }, 3000);
      }
    };

    window.addEventListener('orderEnded', handleOrderEnded as EventListener);
    
    return () => {
      window.removeEventListener('orderEnded', handleOrderEnded as EventListener);
    };
  }, [tableNumber, toast]);

  // Firebase data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["전체"]);
  const [loading, setLoading] = useState(true);
  const [storeDisplayName, setStoreDisplayName] = useState("오더랜드");
  const [categoryMap, setCategoryMap] = useState<{[key: string]: string}>({});
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [isOpen, setIsOpen] = useState(true);

  // URL 파라미터 디코딩
  const decodedStoreName = storeName ? decodeURIComponent(storeName) : 
                          storeId ? decodeURIComponent(storeId) : "오더랜드";
  const decodedTableNumber = tableNumber ? 
    decodeURIComponent(tableNumber).replace('table-', '') : 
    tableId ? decodeURIComponent(tableId) : "1";

  // localStorage에서 장바구니 데이터 로드
  useEffect(() => {
    const cartKey = `cart-${decodedStoreName}-${decodedTableNumber}`;
    console.log('장바구니 로드 시도:', cartKey);
    
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        console.log('장바구니 로드 완료:', parsedCart);
      } catch (error) {
        console.error('장바구니 파싱 오류:', error);
        setCart([]);
      }
    }
  }, [decodedStoreName, decodedTableNumber]);

  // 장바구니 데이터를 localStorage에 저장
  useEffect(() => {
    const cartKey = `cart-${decodedStoreName}-${decodedTableNumber}`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
    console.log('장바구니 저장:', cart);
  }, [cart, decodedStoreName, decodedTableNumber]);

  // Firebase에서 메뉴 데이터 로드
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
        // 클라이언트 사이드에서 필터링: 판매중지 메뉴만 제외
        if (item.status && typeof item.status === 'object') {
          const status = item.status as any;
          const isFiltered = !status.salesStopped; // 판매중지만 제외
          console.log('메뉴 필터링:', item.name, '상태:', status, '표시:', isFiltered);
          return isFiltered;
        }
        console.log('메뉴 필터링:', item.name, '상태: 기본', '표시: true');
        return true;
      });
      
      console.log('필터링된 메뉴:', menuData.length, '개');
      
      // 메뉴 상태 변경 알림
      const previousMenuItems = previousMenuItemsRef.current;
      if (previousMenuItems.length > 0) {
        menuData.forEach(newItem => {
          const previousItem = previousMenuItems.find(item => item.id === newItem.id);
          if (previousItem) {
            const newStatus = getMenuStatus(newItem);
            const previousStatus = getMenuStatus(previousItem);
            
            // 상태가 변경되었고, 품절이나 재료소진이 되었을 때 알림
            if (newStatus !== previousStatus && (newStatus === 'soldOut' || newStatus === 'ingredientsOut')) {
              toast({
                title: "메뉴 상태 변경",
                description: `${newItem.name}이(가) ${getStatusText(newItem)} 상태가 되었습니다.`,
                variant: "destructive",
              });
            }
          }
        });
      }
      
      // 이전 메뉴 상태 업데이트
      previousMenuItemsRef.current = menuData;
      
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
  }, []); // 의존성 배열을 다시 빈 배열로 변경

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

  // 매장 정보 로드
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "store"),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setStoreDisplayName(data.storeName || "오더랜드");
          setBusinessHours(data.businessHours || {});
          
          // 영업시간 확인
          const now = new Date();
          const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
          const todayHours = data.businessHours?.[dayOfWeek];
          
          if (todayHours) {
            const isCurrentlyOpen = checkBusinessHours(data.businessHours);
            setIsOpen(isCurrentlyOpen);
          }
        }
      },
      (error) => {
        console.error("매장 정보 로드 오류:", error);
      }
    );

    return unsubscribe;
  }, []);

  const checkBusinessHours = (hours: BusinessHours) => {
    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const todayHours = hours[dayOfWeek];
    
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

  // 선택된 카테고리에 따라 메뉴 필터링
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

  // 카테고리 변경 시 메뉴 아이템이 변경되었는지 확인
  useEffect(() => {
    const currentMenuItems = filteredMenu.map(item => item.id).sort();
    const previousMenuItems = previousMenuItemsRef.current.map(item => item.id).sort();
    
    if (JSON.stringify(currentMenuItems) !== JSON.stringify(previousMenuItems)) {
      // 메뉴가 변경되었을 때만 카테고리 업데이트
      updateCategoriesFromMenu(menuItems, categoryMap);
    }
    
    previousMenuItemsRef.current = filteredMenu;
  }, [filteredMenu, menuItems, categoryMap]);

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

  const getMenuStatus = (item: MenuItem) => {
    return item.status || 'available';
  };

  const isMenuDisabled = (item: MenuItem) => {
    const status = getMenuStatus(item);
    return status === 'soldout' || status === 'unavailable';
  };

  const getStatusText = (item: MenuItem) => {
    const status = getMenuStatus(item);
    switch (status) {
      case 'soldout':
        return '품절';
      case 'unavailable':
        return '준비중';
      default:
        return '';
    }
  };

  const getStatusColor = (item: MenuItem) => {
    const status = getMenuStatus(item);
    switch (status) {
      case 'soldout':
        return 'bg-red-500 text-white';
      case 'unavailable':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const addToCart = (item: MenuItem) => {
    if (isMenuDisabled(item) || !isOpen) return;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });

    // 별 애니메이션 표시
    setShowStarAnimation(true);
    setTimeout(() => setShowStarAnimation(false), 1000);

    toast({
      title: "장바구니에 추가되었습니다! 🛒",
      description: `${item.name}이(가) 장바구니에 추가되었습니다.`,
    });
  };

  const updateCartQuantity = (id: string, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
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
        ��️
      </span>
    ));
  };

  const serviceItems = [
    { id: 'napkin', name: '냅킨', icon: '🧻' },
    { id: 'spoon', name: '숟가락', icon: '🥄' },
    { id: 'chopsticks', name: '젓가락', icon: '🥢' },
    { id: 'water', name: '물', icon: '💧' },
    { id: 'appetizer', name: '기본 안주', icon: '🍘' }
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else if (prev.length < 3) {
        return [...prev, serviceId];
      }
      return prev;
    });
  };

  const callStaff = () => {
    if (isCallInProgress || callCooldown > 0) return;
    setIsStaffCallOpen(true);
  };

  const closeStaffCall = () => {
    setIsStaffCallOpen(false);
    setSelectedServices([]);
    setCustomRequest('');
  };

  const submitStaffRequest = async () => {
    if (selectedServices.length === 0 && !customRequest.trim()) {
      toast({
        title: "요청 항목을 선택해주세요",
        description: "최소 1개 이상의 서비스를 선택하거나 기타 요청을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsCallInProgress(true);
    
    try {
      // Firebase에 직원 호출 데이터 저장
      const staffCallData = {
        tableNumber: decodedTableNumber,
        storeName: storeDisplayName,
        services: selectedServices,
        customRequest: customRequest.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        storeId: 'default'
      };

      await addDoc(collection(db, "staff-calls"), staffCallData);
      
      // 알림 추가
      addNotification('직원 호출이 접수되었습니다. 잠시만 기다려주세요.', 'staff_call');
      
      // 성공 화면 표시
      setShowSuccessScreen(true);
      closeStaffCall();
      
      // 3초 후 성공 화면 숨기기
      setTimeout(() => {
        setShowSuccessScreen(false);
      }, 3000);
      
      // 토스트 메시지
      setTimeout(() => {
        toast({
          title: "✅ 직원에게 요청이 전달되었어요",
          description: "잠시만 기다려주세요. 직원이 곧 도움을 드릴게요.",
        });
      }, 500);
      
      // 15초 쿨다운 시작
      setCallCooldown(15);
      
    } catch (error) {
      console.error('직원 호출 저장 실패:', error);
      toast({
        title: "요청 전송에 실패했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setIsCallInProgress(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Notification functions
  const addNotification = (message: string, type: 'staff_call' | 'order_update' | 'system' = 'system') => {
    const newNotification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setNotificationCount(prev => prev + 1);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setNotificationCount(0);
  };

  const toggleNotificationPanel = () => {
    setShowNotificationPanel(prev => !prev);
  };

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === '한국어' ? 'English' : '한국어');
    toast({
      title: "언어가 변경되었습니다",
      description: `${currentLanguage === '한국어' ? 'English' : '한국어'}로 변경되었습니다.`,
    });
  };

  const handleMenuClick = (item: MenuItem) => {
    if (isMenuDisabled(item) || !isOpen) return;
    
    setSelectedMenuItem(item);
    setSelectedOptions({});
    setShowOptions(false);
    setIsMenuDetailOpen(true);
  };

  const closeMenuDetail = () => {
    setIsMenuDetailOpen(false);
    setSelectedMenuItem(null);
    setSelectedOptions({});
    setShowOptions(false);
  };

  const handleAddToCartFromDetail = () => {
    if (!selectedMenuItem || isMenuDisabled(selectedMenuItem) || !isOpen) return;

    if (selectedMenuItem.options && selectedMenuItem.options.length > 0 && !showOptions) {
      setShowOptions(true);
      return;
    }

    // 옵션이 있는 경우 옵션 정보도 함께 저장
    const itemToAdd = {
      ...selectedMenuItem,
      quantity: 1,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === selectedMenuItem.id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === selectedMenuItem.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, itemToAdd];
      }
    });

    // 별 애니메이션 표시
    setShowStarAnimation(true);
    setTimeout(() => setShowStarAnimation(false), 1000);

    toast({
      title: "장바구니에 추가되었습니다! 🛒",
      description: `${selectedMenuItem.name}이(가) 장바구니에 추가되었습니다.`,
    });

    closeMenuDetail();
  };

  const updateOptionQuantity = (optionId: string, change: number) => {
    setSelectedOptions(prev => {
      const currentQuantity = prev[optionId] || 0;
      const newQuantity = currentQuantity + change;
      
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
      </div>

      {/* Bottom Fixed Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-50">
        <div className="grid grid-cols-3 gap-3">
          {/* 장바구니 버튼 */}
          <Button 
            onClick={() => {
              const path = storeId && tableId 
                ? `/store/${storeId}/table/${tableId}/cart`
                : `/order/${decodedStoreName}/table-${decodedTableNumber}/cart`;
              navigate(path);
            }}
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
            disabled={isCallInProgress || callCooldown > 0}
            className={`${
              isCallInProgress || callCooldown > 0
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#FF914D] hover:bg-[#e8823d]'
            } text-white h-16 w-full rounded-xl flex flex-col items-center justify-center gap-1`}
          >
            <Bell className="w-8 h-8" />
            <span className="text-base font-bold">
              {callCooldown > 0 ? (
                <div className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{formatTime(callCooldown)}</span>
                </div>
              ) : (
                '직원 호출'
              )}
            </span>
          </Button>

          {/* 주문 내역 버튼 */}
          <Button
            onClick={() => {
              const path = storeId && tableId 
                ? `/store/${storeId}/table/${tableId}/order-history`
                : `/order/${decodedStoreName}/table-${decodedTableNumber}/order-history`;
              navigate(path);
            }}
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

      {/* Staff Call Drawer */}
      <Drawer open={isStaffCallOpen} onOpenChange={setIsStaffCallOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="text-center border-b">
            <DrawerTitle className="text-xl font-bold">무엇을 도와드릴까요?</DrawerTitle>
            <p className="text-sm text-gray-600 mt-1">요청할 항목을 선택해주세요 (최대 3개)</p>
          </DrawerHeader>
          
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Service Items Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {serviceItems.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  disabled={!selectedServices.includes(service.id) && selectedServices.length >= 3}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                    selectedServices.includes(service.id)
                      ? 'border-[#FF914D] bg-[#FF914D]/10 text-[#FF914D]'
                      : selectedServices.length >= 3
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-[#FF914D] hover:bg-[#FF914D]/5'
                  }`}
                >
                  <div className="text-2xl">{service.icon}</div>
                  <span className="text-sm font-medium">{service.name}</span>
                  {selectedServices.includes(service.id) && (
                    <Check className="w-4 h-4 text-[#FF914D]" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Request */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Edit3 className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">기타 요청</label>
              </div>
              <Textarea
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                placeholder="컵 추가, 포크 필요 등 기타 요청사항을 입력하세요"
                className="resize-none h-20"
                maxLength={100}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {customRequest.length}/100
              </div>
            </div>

            {/* Selected Items Summary */}
            {(selectedServices.length > 0 || customRequest.trim()) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">선택된 요청</h4>
                <div className="space-y-1">
                  {selectedServices.map(serviceId => {
                    const service = serviceItems.find(item => item.id === serviceId);
                    return (
                      <div key={serviceId} className="flex items-center space-x-2 text-sm">
                        <span>{service?.icon}</span>
                        <span className="text-gray-700">{service?.name}</span>
                      </div>
                    );
                  })}
                  {customRequest.trim() && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Edit3 className="w-3 h-3" />
                      <span className="text-gray-700">{customRequest}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={submitStaffRequest}
              disabled={isCallInProgress || (selectedServices.length === 0 && !customRequest.trim())}
              className={`w-full h-14 text-lg font-bold rounded-xl ${
                isCallInProgress 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#FF914D] hover:bg-[#e8823d]'
              } text-white`}
            >
              {isCallInProgress ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>요청 전송 중...</span>
                </div>
              ) : (
                '직원에게 요청 보내기'
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Success Screen Overlay */}
      {showSuccessScreen && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 mx-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="mb-6">
              <div className="w-20 h-20 bg-[#FF914D] rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce">
                <Bell className="w-10 h-10 text-white" />
              </div>
              <div className="text-6xl mb-2">👨‍🍳</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                요청이 전달되었어요!
              </h3>
              <p className="text-gray-600 text-sm">
                직원이 곧 도움을 드릴게요
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#FF914D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#FF914D] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#FF914D] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Star Animation Overlay */}
      {showStarAnimation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="animate-bounce">
            <Star className="w-16 h-16 text-yellow-400 fill-current animate-pulse" />
          </div>
        </div>
      )}

      {/* Goodbye Screen Overlay */}
      {showGoodbyeScreen && (
        <div className="fixed inset-0 z-[100] bg-[#FFF8F5] flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 mx-6 max-w-sm w-full text-center shadow-2xl animate-fade-in">
            <div className="mb-6">
              <div className="text-8xl mb-6 animate-bounce">
                👋
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                감사합니다! 또 오세요 🙌
              </h3>
              <p className="text-gray-600 text-base leading-relaxed">
                기분 좋은 시간이었길 바랄게요 😊
                <br />
                <span className="text-[#FF914D] font-medium">다음에도 맛있게 드세요!</span>
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-[#FF914D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-[#FF914D] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-[#FF914D] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {showNotificationPanel && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm" onClick={toggleNotificationPanel}>
          <div className="absolute top-20 right-4 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">알림</h3>
              <button
                onClick={clearAllNotifications}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                모두 지우기
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>새로운 알림이 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notification.type === 'staff_call' && <Bell className="w-5 h-5 text-blue-500" />}
                          {notification.type === 'order_update' && <Clock className="w-5 h-5 text-green-500" />}
                          {notification.type === 'system' && <Check className="w-5 h-5 text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;