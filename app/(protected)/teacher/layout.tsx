
import { TeacherPageContextInjector } from './_components/teacher-page-context-injector';

type Props = {
    children: React.ReactNode;
  };
  
  const TeacherLayout = ({
    children,
  }: Props) => {
    return (
      <div className="">
        <TeacherPageContextInjector />
        {children}
      </div>
    );
  };
  
  export default TeacherLayout;
  