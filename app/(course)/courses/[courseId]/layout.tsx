import { ReactNode } from "react";
import { CourseProviders } from "./_components/course-providers";

interface CourseDetailLayoutProps {
  children: ReactNode;
  params: Promise<{
    courseId: string;
    chapterId?: string;
    sectionId?: string;
  }>;
}

/**
 * Server layout for course detail pages.
 * Extracts params server-side and passes them to client providers.
 */
export default async function CourseDetailLayout({
  children,
  params,
}: CourseDetailLayoutProps) {
  const { courseId, chapterId, sectionId } = await params;

  return (
    <CourseProviders
      courseId={courseId}
      chapterId={chapterId}
      sectionId={sectionId}
    >
      {children}
    </CourseProviders>
  );
}
