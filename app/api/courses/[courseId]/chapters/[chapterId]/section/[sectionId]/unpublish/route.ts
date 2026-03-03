import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string, sectionId:string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
        return ApiResponses.unauthorized();
      }

    const userId = user?.id;

    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId
      }
    });

    if (!ownCourse) {
      return ApiResponses.unauthorized();
    }

    const unpublishedSection = await db.section.update({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,

      },
      data: {
        isPublished: false,
      }
    });

    const publishedSectionsInChapter = await db.section.findMany({
      where: {
        chapterId: params.chapterId,
        isPublished: true,
      },
      take: 200,
    });

    if (!publishedSectionsInChapter.length) {
      await db.chapter.update({
        where: {
          id: params.chapterId,
        },
        data: {
          isPublished: false,
        }
      });
    }

    return NextResponse.json(unpublishedSection);
  } catch (error) {

    return ApiResponses.internal(); 
  }
}