import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  categoryName?: string;
}

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

const CartPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { storeName, tableNumber, storeId, tableId } = useParams<{ 
    storeName?: string; 
    tableNumber?: string;
    storeId?: string;
    tableId?: string;
  }>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});

  // 손님용 페이지에서는 항상 라이트 모드 사용
  useEffect(() => {
    // 다크모드 클래스 제거하여 라이트 모드 강제 적용
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

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

  // Firebase에서 영업시간 가져오기
  useEffect(() => {
    const settingsRef = doc(db, "settings", "store");
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBusinessHours(data.businessHours || {});
        setIsOpen(checkBusinessHours(data.businessHours || {}));
      }
    });

    return () => unsubscribeSettings();
  }, []);

  // URL 파라미터 디코딩
  const decodedStoreName = storeName ? decodeURIComponent(storeName) : 
                          storeId ? decodeURIComponent(storeId) : "오더랜드";
  const decodedTableNumber = tableNumber ? 
    decodeURIComponent(tableNumber).replace('table-', '') : 
    tableId ? decodeURIComponent(tableId) : "1";

  // localStorage에서 장바구니 데이터 로드
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart-${decodedStoreName}-${decodedTableNumber}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('장바구니 데이터 로드 실패:', error);
      }
    }
  }, [decodedStoreName, decodedTableNumber]);

  // 주문 종료 이벤트 감지하여 장바구니 초기화
  useEffect(() => {
    const handleOrderEnded = (event: CustomEvent) => {
      const { tableId } = event.detail;
      console.log('CartPage - 주문 종료 이벤트 감지:', tableId, '현재 테이블:', decodedTableNumber);
      
      // 현재 테이블의 주문이 종료된 경우에만 장바구니 초기화
      if (tableId.toString() === decodedTableNumber) {
        console.log('CartPage - 현재 테이블 주문 종료됨, 장바구니 초기화');
        setCart([]);
        
        // localStorage에서도 장바구니 데이터 제거
        const cartKey = `cart-${decodedStoreName}-${decodedTableNumber}`;
        localStorage.removeItem(cartKey);
        
        toast({
          title: "주문이 종료되었습니다",
          description: "테이블이 초기화되어 새로운 주문을 시작할 수 있습니다.",
        });
      }
    };

    window.addEventListener('orderEnded', handleOrderEnded as EventListener);
    
    return () => {
      window.removeEventListener('orderEnded', handleOrderEnded as EventListener);
    };
  }, [decodedStoreName, decodedTableNumber, toast]);

  // 장바구니 데이터를 localStorage에 저장
  const saveCartToStorage = (newCart: CartItem[]) => {
    localStorage.setItem(`cart-${decodedStoreName}-${decodedTableNumber}`, JSON.stringify(newCart));
  };

  const updateCartQuantity = (id: string, change: number) => {
    setCart(prevCart => {
      const newCart = prevCart.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      saveCartToStorage(newCart);
      return newCart;
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== id);
      saveCartToStorage(newCart);
      return newCart;
    });
    
    toast({
      title: "메뉴가 제거되었습니다",
      description: "장바구니에서 메뉴가 제거되었습니다.",
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "장바구니가 비어있습니다",
        description: "주문할 메뉴를 추가해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 영업시간 체크
    if (!isOpen) {
      toast({
        title: "영업시간이 아닙니다",
        description: "현재 영업시간이 아닙니다. 영업시간을 확인해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Firebase에 주문 저장
      const orderData = {
        storeName: decodedStoreName,
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

      await addDoc(collection(db, "orders"), orderData);
      
      // 장바구니 비우기
      setCart([]);
      saveCartToStorage([]);
      
      toast({
        title: "주문이 접수되었습니다! 🎉",
        description: `주문번호: ${orderData.orderNumber}\n총 ${getTotalPrice().toLocaleString()}원의 주문이 접수되었습니다.`,
      });
      
      // 주문 페이지로 돌아가기
      navigate(`/order/${storeName}/${tableNumber}`);
      
    } catch (error) {
      console.error('주문 실패:', error);
      toast({
        title: "주문 실패",
        description: "주문 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F5] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/order/${storeName}/${tableNumber}`)}
            className="p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">장바구니</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="p-4">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">장바구니가 비어있습니다</h3>
            <p className="text-gray-500 mb-6">메뉴를 선택해서 장바구니에 추가해보세요</p>
            <Button
              onClick={() => navigate(`/order/${storeName}/${tableNumber}`)}
              className="bg-[#FF914D] hover:bg-[#e8823d] text-white"
            >
              메뉴 보기
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.price.toLocaleString()}원</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.id, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">총 수량</span>
                    <span className="font-semibold">{getTotalItems()}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">총 금액</span>
                    <span className="text-xl font-bold text-[#FF914D]">
                      ₩{getTotalPrice().toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Button */}
            <Button
              onClick={handleOrder}
              disabled={loading || !isOpen}
              className="w-full bg-[#FF914D] hover:bg-[#e8823d] text-white h-14 text-lg font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? "주문 처리 중..." : "주문하기"}
            </Button>
            {!isOpen && (
              <p className="text-center text-red-500 mt-4">
                현재 영업 시간이 아닙니다. 영업 시간에 주문해주세요.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage; 