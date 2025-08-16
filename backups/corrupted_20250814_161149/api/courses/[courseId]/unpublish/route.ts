import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-au'

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

    const userId = user?.id;

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    const unpublishedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId,
      },
      data: {
        isPublished: false,
      }
    });

    return NextResponse.json(unpublishedCourse);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}