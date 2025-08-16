import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, withAdminAuth, withOwnership, withPublicAexport const POST = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { url } = await req.json();

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

    const attachment = await db.attachment.create({
      data: {
        url,
        name: url.split("/").pop(),
        courseId: params.courseId,
      }
    });

    return NextResponse.json(attachment);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}