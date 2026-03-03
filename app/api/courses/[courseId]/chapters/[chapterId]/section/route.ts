import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

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
        return ApiResponses.unauthorized();
      }

    const userId = user?.id;

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    const chapterData = await db.chapter.findUnique({
        where:{
            id: params.chapterId
        }
    })
    if (!chapterData) {
        return ApiResponses.unauthorized();
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
  } catch (error) {

    return ApiResponses.internal();
  }
}