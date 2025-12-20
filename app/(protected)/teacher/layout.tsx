import { SmartSidebar } from '@/components/dashboard/smart-sidebar';
import { SmartHeader } from '@/components/dashboard/smart-header';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

const TeacherLayout = async ({ children }: Props) => {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // SAM AI Assistant is now rendered globally in app/layout.tsx
  // with context-awareness built into the UnifiedSAMAssistant component
  return (
    <>
      <SmartSidebar user={user} />
      <div className="lg:ml-[72px]" suppressHydrationWarning>
        <SmartHeader user={user} />
        <div className="min-h-screen pt-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
          {children}
        </div>
      </div>
    </>
  );
};

export default TeacherLayout;
