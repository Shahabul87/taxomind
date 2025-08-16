import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-au

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
        return new NextResponse("Unauthorized", { status: 401 });
      }

    const userId = user?.id;

    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId
      }
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
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
      }
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
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 }); 
  }
}