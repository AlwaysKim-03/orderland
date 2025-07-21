import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  Clock,
  Store,
  QrCode,
  ArrowLeft
} from "lucide-react";

const menuItems = [
  {
    id: 1,
    name: "김치찌개",
    price: 12000,
    description: "매콤한 김치와 돼지고기로 만든 찌개",
    image: "/placeholder.jpg",
    category: "메인메뉴"
  },
  {
    id: 2,
    name: "된장찌개",
    price: 10000,
    description: "집에서 만든 된장으로 끓인 찌개",
    image: "/placeholder.jpg",
    category: "메인메뉴"
  },
  {
    id: 3,
    name: "비빔밥",
    price: 15000,
    description: "신선한 채소와 고소한 고기로 만든 비빔밥",
    image: "/placeholder.jpg",
    category: "메인메뉴"
  },
  {
    id: 4,
    name: "공기밥",
    price: 1000,
    description: "쌀알이 고슬고슬한 공기밥",
    image: "/placeholder.jpg",
    category: "사이드"
  },
  {
    id: 5,
    name: "김치",
    price: 2000,
    description: "매콤달콤한 김치",
    image: "/placeholder.jpg",
    category: "사이드"
  }
];

export function OrderPage() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const categories = ['전체', '메인메뉴', '사이드', '음료'];

  const addToCart = (item) => {
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
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const filteredMenu = selectedCategory === '전체' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">오더랜드</h1>
              <p className="text-sm text-muted-foreground">테이블 3</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-muted-foreground" />
            <Badge variant="outline">QR 주문</Badge>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Menu Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMenu.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="w-12 h-12 text-muted-foreground" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">₩{item.price.toLocaleString()}</span>
                    <Button
                      size="sm"
                      onClick={() => addToCart(item)}
                      className="rounded-full w-8 h-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 bg-card border-l border-border flex flex-col">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              주문 내역
            </CardTitle>
            <CardDescription>
              선택한 메뉴를 확인하고 주문하세요
            </CardDescription>
          </CardHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">장바구니가 비어있습니다</p>
                <p className="text-sm text-muted-foreground">메뉴를 선택해주세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ₩{item.price.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 p-0 text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cart.length > 0 && (
            <div className="border-t border-border p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">총 금액</span>
                <span className="text-2xl font-bold">₩{getTotalPrice().toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>예상 대기시간: 15-20분</span>
              </div>

              <Button className="w-full" size="lg">
                주문하기
                <ShoppingCart className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 