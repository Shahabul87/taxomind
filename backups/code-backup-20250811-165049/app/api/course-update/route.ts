import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {

    // Get user session
    const session = await auth();

    if (!session?.user?.id) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { courseId, ...updateData } = body;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Check if the course exists and belongs to the user
    const existingCourse = await db.course.findUnique({
      where: {
        id: courseId,
        userId: session.user.id,
      }
    });

    if (!existingCourse) {

      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Prepare update data
    const finalUpdateData: any = {};
    
    if (updateData.title !== undefined) finalUpdateData.title = updateData.title;
    if (updateData.description !== undefined) finalUpdateData.description = updateData.description;
    if (updateData.imageUrl !== undefined) finalUpdateData.imageUrl = updateData.imageUrl;
    if (updateData.price !== undefined) finalUpdateData.price = updateData.price;
    if (updateData.whatYouWillLearn !== undefined) finalUpdateData.whatYouWillLearn = updateData.whatYouWillLearn;
    if (updateData.isPublished !== undefined) finalUpdateData.isPublished = updateData.isPublished;
    if (updateData.categoryId !== undefined) finalUpdateData.categoryId = updateData.categoryId;

    // Only update if there are fields to update
    if (Object.keys(finalUpdateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    try {
      // Update the course
      const course = await db.course.update({
        where: {
          id: courseId,
          userId: session.user.id,
        },
        data: finalUpdateData,
      });

      return NextResponse.json({
        success: true,
        course,
        message: "Course updated successfully"
      });
    } catch (dbError: any) {
      logger.error("Database error during update:", dbError);
      return NextResponse.json({ 
        error: `Database Error: ${dbError.message}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    logger.error("[COURSE_UPDATE] Detailed error:", error);
    return NextResponse.json({ 
      error: `Internal Error: ${error.message}` 
    }, { status: 500 });
  }
} 