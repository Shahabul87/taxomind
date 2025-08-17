import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const values = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the course exists and belongs to the user
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Update the section
    const section = await db.section.update({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    logger.error("[SECTION_UPDATE_ERROR]:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the course exists and belongs to the user
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Fetch the section
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      include: {
        chapter: {
          select: {
            title: true,
            course: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    if (!section) {
      return new NextResponse("Section not found", { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    logger.error("[SECTION_GET_ERROR]:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete the section
    const deletedSection = await db.section.delete({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId
      }
    });

    return NextResponse.json(deletedSection);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 