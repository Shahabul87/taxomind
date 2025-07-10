import { AdminGuard } from "@/components/auth/admin-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50/50">
        <div className="border-b bg-white">
          <div className="container flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
        </div>
        <main className="container mx-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}