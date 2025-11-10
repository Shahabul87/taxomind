import { ComprehensiveSAMProvider } from './_components/comprehensive-sam-provider';
// REMOVED: import { SamAITutorAssistant } from './_components/sam-ai-tutor-assistant';
// Using global SAM from layout.tsx instead
import { TeacherPageContextInjector } from './_components/teacher-page-context-injector';
import { SmartSidebar } from '@/components/dashboard/smart-sidebar';
import { SmartHeader } from '@/components/dashboard/smart-header';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

type Props = {
    children: React.ReactNode;
  };

  const TeacherLayout = async ({
    children,
  }: Props) => {
    const user = await currentUser();

    if (!user) {
      redirect('/auth/login');
    }

    return (
      <ComprehensiveSAMProvider>
        <>
          <SmartSidebar user={user} />
          <div className="ml-[72px]">
            <SmartHeader user={user} />
            <div className="min-h-screen pt-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
              <TeacherPageContextInjector />
              {children}
              {/* REMOVED: <SamAITutorAssistant /> - Using global SAM from root layout.tsx */}
            </div>
          </div>
        </>
      </ComprehensiveSAMProvider>
    );
  };

  export default TeacherLayout;
  
