import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { EnterpriseChapterView } from "./_components/enterprise/enterprise-chapter-view";
import { getCourse } from "@/actions/get-course";
import { logger } from '@/lib/logger';

interface ChapterPageProps {
  params: Promise<{
    courseId: string;
    chapterId: string;
  }>;
}

const ChapterIdPage = async (props: ChapterPageProps) => {
  const params = await props.params;
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  // Verify enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: params.courseId,
      }
    }
  });

  if (!enrollment) {
    return redirect(`/courses/${params.courseId}`);
  }

  // Fetch course with chapters and sections using the action
  const { course, error } = await getCourse(params.courseId);

  if (error) {
    logger.error("[COURSE_FETCH_ERROR]", error);
    return redirect("/error");
  }

  if (!course || !course.chapters.length) {
    return redirect("/");
  }

  const chapter = course.chapters.find(chapter => chapter.id === params.chapterId);

  if (!chapter) {
    return redirect(`/courses/${params.courseId}`);
  }

  return (
    <EnterpriseChapterView
      chapter={chapter as any}
      course={course as any}
      userId={user.id}
    />
  );
};

export default ChapterIdPage; 
