
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
        <div className="">
          <TeacherPageContextInjector />
          {children}
          <SamAITutorAssistant />
        </div>
      </ComprehensiveSAMProvider>
    );
  };
  
  export default TeacherLayout;
  