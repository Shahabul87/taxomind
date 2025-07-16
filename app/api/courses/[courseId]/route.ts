import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Force Node.js runtime
export const runtime = 'nodejs';

// Enhanced DELETE route with detailed error handling - v2.0
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    console.log("[COURSE_DELETE] Starting deletion for courseId:", courseId);
    
    const user = await currentUser();

    if (!user?.id) {
      console.log("[COURSE_DELETE] Authentication failed - no user");
      return NextResponse.json({ error: "Unauthorized", details: "No authenticated user" }, { status: 401 });
    }

    console.log("[COURSE_DELETE] Authenticated user:", user.id);

    // First, check if the course exists at all
    const courseExists = await db.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        userId: true,
        title: true,
      }
    });

    console.log("[COURSE_DELETE] Course existence check:", courseExists ? {
      id: courseExists.id,
      userId: courseExists.userId,
      title: courseExists.title,
      userOwns: courseExists.userId === user.id
    } : "Course not found");

    if (!courseExists) {
      console.log("[COURSE_DELETE] Course does not exist in database");
      return NextResponse.json({ 
        error: "Course not found", 
        details: `Course with ID ${courseId} does not exist`,
        courseId 
      }, { status: 404 });
    }

    // Check if user owns the course
    if (courseExists.userId !== user.id) {
      console.log("[COURSE_DELETE] User does not own course");
      console.log("[COURSE_DELETE] Course owner:", courseExists.userId);
      console.log("[COURSE_DELETE] Current user:", user.id);
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: "You do not own this course",
        courseId,
        courseOwner: courseExists.userId,
        currentUser: user.id
      }, { status: 403 });
    }

    // Now find the course with ownership check for deletion
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      }
    });

    if (!course) {
      console.log("[COURSE_DELETE] Course not found with ownership check (this shouldn't happen)");
      return NextResponse.json({ error: "Course not found with ownership" }, { status: 404 });
    }

    console.log("[COURSE_DELETE] About to delete course:", course.title);

    await db.course.delete({
      where: {
        id: courseId,
      }
    });

    console.log("[COURSE_DELETE] Course deleted successfully");
    return NextResponse.json({ 
      success: true, 
      message: "Course deleted successfully",
      deletedCourse: {
        id: course.id,
        title: course.title
      }
    });
  } catch (error) {
    console.error("[COURSE_DELETE] Error:", error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("[COURSE_DELETE] Error name:", error.name);
      console.error("[COURSE_DELETE] Error message:", error.message);
      console.error("[COURSE_DELETE] Error stack:", error.stack);
    }
    
    return NextResponse.json({ 
      error: "Internal Error", 
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    console.log("[COURSE_PATCH] Starting update for courseId:", courseId);
    
    const user = await currentUser();
    
    if (!user?.id) {
      console.log("[COURSE_PATCH] Authentication failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("[COURSE_PATCH] Authenticated user:", user.id);
    
    const values = await request.json();
    console.log("[COURSE_PATCH] Request body values:", values);

    const updateData: any = {};
    
    if (values.title !== undefined) updateData.title = values.title;
    if (values.description !== undefined) updateData.description = values.description;
    if (values.imageUrl !== undefined) updateData.imageUrl = values.imageUrl;
    if (values.price !== undefined) updateData.price = values.price;
    if (values.whatYouWillLearn !== undefined) updateData.whatYouWillLearn = values.whatYouWillLearn;
    if (values.isPublished !== undefined) updateData.isPublished = values.isPublished;
    if (values.subtitle !== undefined) updateData.subtitle = values.subtitle;
    // Note: targetAudience and difficulty fields don't exist in Course schema, skipping
    
    if (values.categoryId !== undefined) {
      if (values.categoryId) {
        try {
          let category = await db.category.findUnique({
            where: { id: values.categoryId }
          });
          
          if (!category) {
            const categoryName = values.categoryId
              .split('-')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            console.log("[COURSE_PATCH] Looking for or creating category:", categoryName);
            
            category = await db.category.findFirst({
              where: {
                name: {
                  equals: categoryName,
                  mode: 'insensitive'
                }
              }
            });
            
            if (!category) {
              category = await db.category.create({
                data: {
                  id: values.categoryId,
                  name: categoryName,
                }
              });
              console.log("[COURSE_PATCH] Created new category:", category);
            }
          }
          
          updateData.categoryId = category.id;
          console.log("[COURSE_PATCH] Using category:", category);
        } catch (categoryError: any) {
          console.error("[COURSE_PATCH] Error handling category:", categoryError);
        }
      } else {
        updateData.categoryId = null;
      }
    }

    console.log("[COURSE_PATCH] Prepared update data:", updateData);
    
    if (Object.keys(updateData).length === 0) {
      console.log("[COURSE_PATCH] No fields to update");
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const existingCourse = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      }
    });

    if (!existingCourse) {
      console.log("[COURSE_PATCH] Course not found or doesn't belong to user");
      console.log("[COURSE_PATCH] User ID:", user.id);
      console.log("[COURSE_PATCH] Course ID:", courseId);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    console.log("[COURSE_PATCH] Found existing course:", existingCourse.id);

    try {
      const course = await db.course.update({
        where: {
          id: courseId,
          userId: user.id,
        },
        data: updateData,
      });

      console.log("[COURSE_PATCH] Course updated successfully:", course);
      return NextResponse.json(course);
    } catch (dbError: any) {
      console.error("[COURSE_PATCH] Database error during update:", dbError);
      return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[COURSE_PATCH] Detailed error:", error);
    if (error.name === "SyntaxError") {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    return NextResponse.json({ error: `Internal Error: ${error.message}` }, { status: 500 });
  }
}