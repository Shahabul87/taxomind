import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-au'

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string, chapterId:string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { title } = await req.json();

    if (!user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

    const userId = user?.id;

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chapterData = await db.chapter.findUnique({
        where:{
            id: params.chapterId
        }
    })
    if (!chapterData) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

    const lastSection = await db.section.findFirst({
      where: {
        chapterId: params.chapterId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastSection ? lastSection.position + 1 : 1;
 
    const section = await db.section.create({
      data: {
        title,
        chapterId: params.chapterId,
        position: newPosition,
      }
    });

    return NextResponse.json(section);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}