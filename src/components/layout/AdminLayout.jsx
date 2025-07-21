import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "../AdminHeader";

export function AdminLayout({ children, restaurantName, onLogout, callRequests, activeTab, onTabChange }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={onTabChange} />
        
        <div className="flex-1 flex flex-col">
          <AdminHeader 
            restaurantName={restaurantName}
            onLogout={onLogout}
            callRequests={callRequests}
          />
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 