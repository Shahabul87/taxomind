import { auth } from "@/auth";
import { withAuth } from '@/lib/api/with-api-auth';
import { db } from "@/lib/db";
import { NextResponse } from "next/server";


export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, sectionId, explanationId } = await params;
    const { heading, code, explanation, language, order } = await req.json();

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Prepare update data
    const updateData: any = {};
    if (heading !== undefined) updateData.heading = heading;
    if (code !== undefined) updateData.code = code;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (language !== undefined) updateData.language = language;
    if (order !== undefined) updateData.order = order;

    // Update code explanation
    const codeExplanation = await db.codeExplanation.update({
      where: {
        id: explanationId,
        sectionId: sectionId,
      },
      data: updateData,
    });

    return NextResponse.json(codeExplanation);
export const DELETE = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
}););
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, sectionId, explanationId } = await params;

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete code explanation
    const codeExplanation = await db.codeExplanation.delete({
      where: {
        id: explanationId,
        sectionId: sectionId,
      },
    });

    return NextResponse.json(codeExplanation);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, sectionId, explanationId } = await params;

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get specific code explanation
    const codeExplanation = await db.codeExplanation.findUnique({
      where: {
        id: explanationId,
        sectionId: sectionId,
      },
    });

    if (!codeExplanation) {
      return new NextResponse("Code explanation not found", { status: 404 });
    }

    return NextResponse.json(codeExplanation);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 