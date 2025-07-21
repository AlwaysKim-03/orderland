import { 
  Home, 
  ShoppingCart, 
  Menu, 
  TrendingUp, 
  Calendar, 
  Settings,
  Store,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "관리자페이지", id: "admin", icon: Home },
  { title: "주문 현황", id: "orders", icon: ShoppingCart },
  { title: "메뉴 변경", id: "menu", icon: Menu },
  { title: "매출 정보", id: "sales", icon: TrendingUp },
  { title: "예약", id: "reservation", icon: Calendar },
  { title: "설정", id: "settings", icon: Settings },
];

export function AdminSidebar({ activeTab, onTabChange }) {
  const { state, setState } = useSidebar();
  const collapsed = state === "collapsed";

  const getNavClass = (isActive) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const toggleSidebar = () => {
    setState(collapsed ? "expanded" : "collapsed");
  };

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-card border-r border-border">
        {/* Logo and Brand */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-primary-foreground" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-lg font-bold text-primary">오더랜드</h1>
                  <p className="text-xs text-muted-foreground">주문 관리 서비스</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
            메뉴
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    className={`h-12 ${getNavClass(activeTab === item.id)}`}
                    onClick={() => onTabChange(item.id)}
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.title}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
} 