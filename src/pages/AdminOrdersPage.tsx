import { AdminLayout } from "@/components/admin/AdminLayout";
import { TableManagement } from "@/components/admin/TableManagement";

const AdminOrdersPage = () => {
  return (
    <AdminLayout>
      <div className="flex flex-col min-h-screen bg-background">
        <TableManagement />
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;