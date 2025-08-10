import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ChapterPageClient } from "./_components/chapter-page-client";
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
      }
    }
  });

  if (!chapter) {
    logger.error("Chapter not found");
    return redirect("/");
  }

  return <ChapterPageClient chapter={chapter} params={params} />;
}
 
export default ChapterIdPage;