import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withAuth, withAdminAuth, withOwnership, withPublicAexport const PATCH = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { heading, code, explanation } = await req.json();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedExplanation = await db.codeExplanation.update({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      },
      data: {
        heading,
        code,
        explanation,
      }
    });

    return NextResponse.json(updatedExplanation);
export const DELETE = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
}););
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const deletedExplanation = await db.codeExplanation.delete({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(deletedExplanation);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const explanation = await db.codeExplanation.findUnique({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(explanation);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 