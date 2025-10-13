import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EnterpriseChapterPageClient } from "./_components/enterprise-chapter-page-client";
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
          title: true
        }
      }
    }
  });

  if (!chapter) {
    logger.error("Chapter not found");
    return redirect("/");
  }

  return <EnterpriseChapterPageClient chapter={chapter} params={params} />;
}
 
export default ChapterIdPage;