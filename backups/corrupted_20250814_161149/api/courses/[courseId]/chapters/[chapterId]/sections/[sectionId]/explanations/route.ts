import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { withAuth, withAdminAuth, withOwnership, withPublicAexport const POST = withAuth(async (request, context, params) => {
  
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

    const sectionOwner = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapter: {
          courseId: params.courseId
        }
      }
    });

    if (!sectionOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const codeExplanation = await db.codeExplanation.create({
      data: {
        heading,
        code,
        explanation,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(codeExplanation);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 