import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCourse } from "@/actions/get-course";
import { getChapter } from "@/actions/get-chapter";
import { getSection } from "@/actions/get-section";
import { db } from "@/lib/db";
import { EnhancedSectionLearningPersonalized } from "./_components/enhanced-section-learning-personalized";

interface SectionPageProps {
  params: Promise<{
    courseId: string;
    chapterId: string;
    sectionId: string;
  }>;
}

const SectionPage = async (props: SectionPageProps) => {
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

  // Fetch course data with full relationships
  const courseData = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        orderBy: {
          position: "asc",
        },
        include: {
          sections: {
            orderBy: {
              position: "asc",
            },
            include: {
              user_progress: {
                where: {
                  userId: user.id,
                },
              },
              videos: true,
              blogs: true,
              articles: true,
              notes: true,
              codeExplanations: true,
            },
          },
        },
      },
    },
  });

  if (!courseData) {
    return redirect("/error");
  }

  // Find the current chapter and section
  const currentChapter = courseData.chapters.find(
    (chapter) => chapter.id === params.chapterId
  );

  if (!currentChapter) {
    return redirect("/error");
  }

  const currentSection = currentChapter.sections.find(
    (section) => section.id === params.sectionId
  );

  if (!currentSection) {
    return redirect("/error");
  }

  // Calculate progress data
  const totalSections = courseData.chapters.reduce(
    (acc, chapter) => acc + chapter.sections.length,
    0
  );
  
  const completedSections = courseData.chapters.reduce(
    (acc, chapter) => 
      acc + chapter.sections.filter(section => 
        section.user_progress.some(p => p.isCompleted)
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

  return (
    <EnhancedSectionLearningPersonalized
      user={user as any}
      course={courseData}
      currentChapter={currentChapter}
      currentSection={currentSection}
      nextSection={nextSection}
      prevSection={prevSection}
      nextChapterSection={nextChapterSection}
      totalSections={totalSections}
      completedSections={completedSections}
      courseId={params.courseId}
      chapterId={params.chapterId}
      sectionId={params.sectionId}
    />
  );
};

export default SectionPage; 