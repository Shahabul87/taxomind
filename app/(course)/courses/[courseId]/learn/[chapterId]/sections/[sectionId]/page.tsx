import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getLearningPageData, getUserProgress } from '@/lib/queries/learning-queries';
import { EnterpriseSectionLearning } from './_components/enterprise-section-learning';
import { LearningModeProvider } from '../../../_components/learning-mode-context';
import { Suspense } from 'react';
import { SectionLoadingSkeleton } from './_components/section-loading-skeleton';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';

// Input validation schema
const SectionPageParamsSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  chapterId: z.string().min(1, "Chapter ID is required"),
  sectionId: z.string().min(1, "Section ID is required"),
});

interface SectionPageProps {
  params: Promise<{
    courseId: string;
    chapterId: string;
    sectionId: string;
  }>;
}

const SectionPage = async (props: SectionPageProps): Promise<JSX.Element> => {
  const rawParams = await props.params;
  const user = await currentUser();

  // Validate parameters
  let params: z.infer<typeof SectionPageParamsSchema>;
  try {
    params = SectionPageParamsSchema.parse(rawParams);
  } catch (error) {
    logger.error("Invalid section page parameters", error instanceof Error ? error : new Error(String(error)));
    return redirect("/dashboard/user/my-courses");
  }

  // ✅ SINGLE OPTIMIZED QUERY (was 3 queries before)
  const courseData = await getLearningPageData({
    courseId: params.courseId,
    chapterId: params.chapterId,
    sectionId: params.sectionId,
    userId: user?.id ?? null,
  });

  if (!courseData) {
    return redirect("/courses");
  }

  // Find the current chapter and section
  const currentChapter = courseData.chapters.find(
    (chapter) => chapter.id === params.chapterId
  );

  if (!currentChapter) {
    return redirect("/courses");
  }

  const currentSection = currentChapter.sections.find(
    (section) => section.id === params.sectionId
  );

  if (!currentSection) {
    return redirect("/courses");
  }

  // Check authentication for non-free content
  if (!user?.id && !currentSection.isFree && !currentSection.isPreview) {
    return redirect("/auth/login");
  }

  // Check if user is the teacher
  const isTeacher = courseData.userId === user?.id;

  // Check if user has premium/subscription access
  let isPremium = false;
  if (user?.id) {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isPremium: true, hasAIAccess: true },
    });
    isPremium = dbUser?.isPremium === true || dbUser?.hasAIAccess === true;
  }

  // Get enrollment from the query result
  const enrollment = courseData.Enrollment?.[0] ?? null;

  // Determine access mode
  let mode: "learning" | "preview" | "restricted" = "restricted";
  if (isTeacher) {
    mode = "preview";
  } else if (enrollment) {
    mode = "learning";
  }

  // If restricted mode and course is not published, redirect
  if (mode === "restricted" && !courseData.isPublished) {
    return redirect(`/courses/${params.courseId}`);
  }

  // Calculate progress data
  const totalSections = courseData.chapters.reduce(
    (acc, chapter) => acc + chapter.sections.length,
    0
  );
  
  const completedSections = courseData.chapters.reduce(
    (acc, chapter) =>
      acc + chapter.sections.filter(section =>
        section.user_progress?.some(p => p.isCompleted) ?? false
      ).length,
    0
  );

  const currentSectionIndex = currentChapter.sections.findIndex(
    (s) => s.id === params.sectionId
  );

  const nextSection = currentChapter.sections[currentSectionIndex + 1] || null;
  const prevSection = currentChapter.sections[currentSectionIndex - 1] || null;

  // Find next section from next chapter if current chapter is complete
  let nextChapterSection = null;
  if (!nextSection) {
    const currentChapterIndex = courseData.chapters.findIndex(
      (c) => c.id === params.chapterId
    );
    const nextChapter = courseData.chapters[currentChapterIndex + 1];
    if (nextChapter && nextChapter.sections.length > 0) {
      nextChapterSection = {
        section: nextChapter.sections[0],
        chapter: nextChapter,
      };
    }
  }

  // Fetch user progress if in learning mode
  let userProgress = null;
  if (mode === "learning" && user?.id) {
    userProgress = await getUserProgress({
      userId: user.id,
      sectionId: params.sectionId,
    });
  }

  return (
    <LearningModeProvider
      mode={mode}
      user={user ?? null}
      enrollment={enrollment}
      isTeacher={isTeacher}
      isPremium={isPremium}
    >
      <Suspense fallback={<SectionLoadingSkeleton />}>
        <EnterpriseSectionLearning
          user={user ?? null}
          course={courseData as any}
          currentChapter={currentChapter as any}
          currentSection={currentSection as any}
          nextSection={nextSection as any}
          prevSection={prevSection as any}
          nextChapterSection={nextChapterSection as any}
          totalSections={totalSections}
          completedSections={completedSections}
          courseId={params.courseId}
          chapterId={params.chapterId}
          sectionId={params.sectionId}
          userProgress={userProgress as any}
        />
      </Suspense>
    </LearningModeProvider>
  );
};

export default SectionPage; 