import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EnterpriseChapterPageClient } from "./_components/enterprise-chapter-page-client";
import { SimpleChapterContext } from "../../../../_components/simple-chapter-context";
import { logger } from '@/lib/logger';

const ChapterIdPage = async (
  props: {
    params: Promise<{ courseId: string; chapterId: string }>
  }
) => {
  const params = await props.params;
  const user = await currentUser();

  if (!user?.id) {
      return redirect("/");
    }

  const chapter = await db.chapter.findUnique({
    where: {
      id: params.chapterId,
      courseId: params.courseId
    },
    include:{
      sections:{
        orderBy:{
          position:"asc"
        }
      },
      course: {
        select: {
          title: true,
          description: true,
          whatYouWillLearn: true,
          courseGoals: true,
          difficulty: true,
          category: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!chapter) {
    logger.error("Chapter not found");
    return redirect("/");
  }

  return (
    <>
      <SimpleChapterContext
        chapter={{
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          isPublished: chapter.isPublished,
          isFree: chapter.isFree,
          position: chapter.position,
          courseId: params.courseId,
          courseTitle: chapter.course?.title,
          sections: chapter.sections?.map(s => ({
            id: s.id,
            title: s.title,
            isPublished: s.isPublished,
            position: s.position,
            type: s.type,
          })),
        }}
        completionStatus={{
          titleDesc: !!(chapter.title && chapter.description),
          sections: (chapter.sections?.length ?? 0) > 0,
        }}
      />
      <EnterpriseChapterPageClient chapter={chapter} params={params} />
    </>
  );
}
 
export default ChapterIdPage;