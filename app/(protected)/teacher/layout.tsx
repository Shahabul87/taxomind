
import { ComprehensiveSAMProvider } from './_components/comprehensive-sam-provider';
import { SamAITutorAssistant } from './_components/sam-ai-tutor-assistant';
import { TeacherPageContextInjector } from './_components/teacher-page-context-injector';

type Props = {
    children: React.ReactNode;
  };
  
  const TeacherLayout = ({
    children,
  }: Props) => {
    return (
      <ComprehensiveSAMProvider>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
          <TeacherPageContextInjector />
          {children}
          <SamAITutorAssistant />
        </div>
      </ComprehensiveSAMProvider>
    );
  };
  
  export default TeacherLayout;
  
