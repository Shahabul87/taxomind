import { PageBackground } from '@/components/ui/page-background';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageBackground>
      <div className="flex items-center justify-center min-h-screen">
        {children}
      </div>
    </PageBackground>
  );
}