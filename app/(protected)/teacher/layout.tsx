
// Keeping the old imports commented for reference
// import { UniversalSamProvider } from './_components/universal-sam-provider';
// import { UniversalSamAssistant } from './_components/universal-sam-assistant';

// Using Enhanced SAM AI Assistant
import { EnhancedSamProvider } from './_components/enhanced-sam-provider';
import { EnhancedSamAssistant } from './_components/enhanced-sam-assistant';
import { TeacherPageContextInjector } from './_components/teacher-page-context-injector';

type Props = {
    children: React.ReactNode;
  };
  
  const TeacherLayout = ({
    children,
  }: Props) => {
    return (
      <EnhancedSamProvider>
        <TeacherPageContextInjector />
        <div className="">
          {children}
        </div>
        <EnhancedSamAssistant />
      </EnhancedSamProvider>
    );
  };
  
  export default TeacherLayout;
  