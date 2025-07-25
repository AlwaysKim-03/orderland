import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatisticsCards } from "@/components/admin/StatisticsCards";
import { OrdersSection } from "@/components/admin/OrdersSection";
import { ReservationsSection } from "@/components/admin/ReservationsSection";

const AdminDashboard = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          
          <main className="flex-1 p-6 space-y-8">
            {/* Statistics Cards */}
            <StatisticsCards />
            
            {/* Orders Section */}
            <OrdersSection />
            
            {/* Reservations Section */}
            <ReservationsSection />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard; 