import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Store, Smartphone, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  // 손님용 페이지에서는 항상 라이트 모드 사용
  useEffect(() => {
    // 다크모드 클래스 제거하여 라이트 모드 강제 적용
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  const features = [
    {
      icon: QrCode,
      title: "QR 코드 주문",
      description: "테이블에서 바로 주문하는 간편한 시스템"
    },
    {
      icon: Store,
      title: "관리자 대시보드",
      description: "매출 분석과 메뉴 관리를 한 곳에서"
    },
    {
      icon: Smartphone,
      title: "모바일 최적화",
      description: "어떤 기기에서도 쉽게 사용할 수 있어요"
    },
    {
      icon: TrendingUp,
      title: "매출 분석",
      description: "실시간 매출 현황과 인기 메뉴 확인"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-white to-accent/30">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary">오더랜드</h1>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/login")}
              className="btn-bounce"
            >
              로그인
            </Button>
            <Button 
              onClick={() => navigate("/register")}
              className="btn-bounce bg-primary-gradient"
            >
              시작하기
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              QR 코드로 쉽고 빠른
              <span className="text-primary block mt-2">스마트 주문 시스템</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              테이블에서 바로 주문하고, 매출을 실시간으로 확인하세요.
              <br />
              당신의 레스토랑을 더 스마트하게 만들어보세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="order-button text-lg px-8 py-4"
              onClick={() => navigate("/admin")}
            >
              <Store className="w-5 h-5 mr-2" />
              관리자로 시작하기
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="btn-bounce text-lg px-8 py-4"
              onClick={() => navigate("/order")}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              주문하기 체험
            </Button>
          </div>

          {/* Demo QR Code */}
          <div className="qr-container inline-block">
            <div className="w-32 h-32 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <QrCode className="w-16 h-16 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              QR 코드를 스캔하여 주문을 시작하세요
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            왜 오더랜드를 선택해야 할까요?
          </h3>
          <p className="text-lg text-muted-foreground">
            간편하고 직관적인 주문 시스템으로 고객과 사업주 모두가 만족합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover text-center">
              <CardHeader className="pb-4">
                <div className="mx-auto p-3 bg-primary/10 rounded-xl w-fit mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="stats-card text-center">
              <div className="text-3xl font-bold text-primary mb-2">1,000+</div>
              <div className="text-muted-foreground">활성 레스토랑</div>
            </div>
            <div className="stats-card text-center">
              <div className="text-3xl font-bold text-primary mb-2">50,000+</div>
              <div className="text-muted-foreground">월간 주문</div>
            </div>
            <div className="stats-card text-center">
              <div className="text-3xl font-bold text-primary mb-2">4.8/5</div>
              <div className="text-muted-foreground">사용자 만족도</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            지금 바로 시작해보세요
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            설정은 5분이면 충분합니다. 오늘부터 스마트한 주문 시스템을 경험해보세요.
          </p>
          <Button 
            size="lg" 
            className="order-button text-lg px-12 py-4"
            onClick={() => navigate("/register")}
          >
            무료로 시작하기
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="p-1 bg-primary rounded-lg">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">오더랜드</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 오더랜드. 모든 권리 보유.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;