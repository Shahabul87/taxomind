import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

// Reorder learning objectives
export async function PATCH(
  req: Request, 
  props: { params: Promise<{ courseId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const { fromIndex, toIndex } = await req.json();
    
    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }
    
    if (
      typeof fromIndex !== 'number' || 
      typeof toIndex !== 'number' || 
      fromIndex < 0 || 
      toIndex < 0
    ) {
      return ApiResponses.badRequest("Invalid indices");
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
      return ApiResponses.notFound();
    }
    
    const objectives = course.whatYouWillLearn || [];
    
    if (fromIndex >= objectives.length || toIndex >= objectives.length) {
      return ApiResponses.badRequest("Invalid indices");
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
  } catch (error) {

    return ApiResponses.internal();
  }
} 