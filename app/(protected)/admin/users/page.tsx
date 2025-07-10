import { AdminGuard } from "@/components/auth/admin-guard";
import { UserManagementTable } from "./_components/user-management-table";

export default function UsersManagementPage() {
  return (
    <AdminGuard>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions across the platform
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <UserManagementTable />
        </div>
      </div>
    </AdminGuard>
  );
}