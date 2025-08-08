import { Store, Home, ShoppingCart, Menu, TrendingUp, Calendar, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
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
  { title: "관리자페이지", url: "/admin", icon: Home },
  { title: "주문 현황", url: "/admin/orders", icon: ShoppingCart },
  { title: "메뉴 변경", url: "/admin/menu", icon: Menu },
  { title: "매출 정보", url: "/admin/sales", icon: TrendingUp },
  { title: "예약", url: "/admin/reservations", icon: Calendar },
  { title: "설정", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-card border-r border-border">
        {/* Logo and Brand */}
        <div className="p-6 border-b border-border">
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
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 py-2">
            메뉴
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className={getNavClass}
                    >
                      <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
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