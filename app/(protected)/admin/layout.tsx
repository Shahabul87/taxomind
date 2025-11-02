import { AdminGuard } from "@/components/auth/admin-guard";
import { MFAWarningBanner } from "@/components/admin/mfa-warning-banner";
import { SessionTimer } from "@/components/auth/session-timer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <SessionTimer />
      <div className="min-h-screen bg-gray-50/50">
        <div className="border-b bg-white">
          <div className="container flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
        </div>
        <main className="container mx-auto p-4">
          <MFAWarningBanner />
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}