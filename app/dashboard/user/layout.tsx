import { UnifiedDashboardProvider } from '@/lib/contexts/unified-dashboard-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UnifiedDashboardProvider>
      <div className="relative min-h-screen">
        {children}
      </div>
    </UnifiedDashboardProvider>
  );
}