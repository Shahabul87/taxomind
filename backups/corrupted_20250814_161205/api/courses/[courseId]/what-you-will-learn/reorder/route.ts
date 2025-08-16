import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-aexport const PATCH = withAuth(async (request, context, params) => {'
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});
) {
  const params = await props.params;
  try {
    const session = await auth();
    const { fromIndex, toIndex } = await req.json();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    if (
      typeof fromIndex !== 'number' || 
      typeof toIndex !== 'number' || 
      fromIndex < 0 || 
      toIndex < 0
    ) {
      return new NextResponse("Invalid indices", { status: 400 });
    }
    
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      select: {
        whatYouWillLearn: true,
        userId: true,
      }
    });
    
    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    const objectives = course.whatYouWillLearn || [];
    
    if (fromIndex >= objectives.length || toIndex >= objectives.length) {
      return new NextResponse("Invalid indices", { status: 400 });
    }
    
    // Perform the reordering
    const updatedObjectives = [...objectives];
    const [movedItem] = updatedObjectives.splice(fromIndex, 1);
    updatedObjectives.splice(toIndex, 0, movedItem);
    
    const updatedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      data: {
        whatYouWillLearn: updatedObjectives,
      },
    });
    
    return NextResponse.json(updatedCourse);
  } catch (error: any) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 