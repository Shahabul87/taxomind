import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { logCourseUpdate, logCourseDeletion } from '@/lib/audit/course-audit';
import { queueCourseReindex } from '@/lib/sam/memory-lifecycle-service';

const UpdateCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be at most 200 characters").optional(),
  description: z.string().max(10000, "Description must be at most 10000 characters").optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL").max(2048).optional().nullable(),
  price: z.number().min(0, "Price must be non-negative").max(10000, "Price must be at most 10000").optional().nullable(),
  whatYouWillLearn: z.array(z.string().max(500)).max(20, "Maximum 20 learning objectives").optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  subtitle: z.string().max(500, "Subtitle must be at most 500 characters").optional().nullable(),
  categoryId: z.string().max(100).optional().nullable(),
  subcategoryId: z.string().max(100).optional().nullable(),
}).strict();

// Force Node.js runtime
export const runtime = 'nodejs';

// Helper to extract request metadata
function getRequestMetadata(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

// Enhanced DELETE route with detailed error handling - v2.0
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    const user = await currentUser();

    if (!user?.id) {

      return NextResponse.json({ error: "Unauthorized", details: "No authenticated user" }, { status: 401 });
    }

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

    if (!courseExists) {

      return NextResponse.json({ 
        error: "Course not found", 
        details: `Course with ID ${courseId} does not exist`,
        courseId 
      }, { status: 404 });
    }

    // Check if user owns the course
    if (courseExists.userId !== user.id) {

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

    await db.course.delete({
      where: {
        id: courseId,
      }
    });

    // Audit logging - track course deletion for compliance
    const { ipAddress, userAgent } = getRequestMetadata(request);
    await logCourseDeletion(courseId, {
      userId: user.id,
      ipAddress,
      userAgent,
    }, {
      deletedTitle: course.title,
      deletedAt: new Date().toISOString(),
    }).catch(err => {
      logger.warn("[COURSE_DELETE] Audit logging failed", { error: err });
    });

    // Queue memory lifecycle reindex for deleted course content
    await queueCourseReindex(courseId, 'delete').catch(err => {
      logger.warn("[COURSE_DELETE] Memory reindex queue failed", { error: err });
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
      deletedCourse: {
        id: course.id,
        title: course.title
      }
    });
  } catch (error) {
    logger.error("[COURSE_DELETE] Error:", error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      logger.error("[COURSE_DELETE] Error name:", error.name);
      logger.error("[COURSE_DELETE] Error message:", error.message);
      logger.error("[COURSE_DELETE] Error stack:", error.stack);
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

    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod schema
    const parseResult = UpdateCourseSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const values = parseResult.data;

    const updateData: Record<string, string | number | boolean | string[] | null | undefined> = {};

    if (values.title !== undefined) updateData.title = values.title;
    if (values.description !== undefined) updateData.description = values.description;
    if (values.imageUrl !== undefined) updateData.imageUrl = values.imageUrl;
    if (values.price !== undefined) updateData.price = values.price;
    if (values.whatYouWillLearn !== undefined) updateData.whatYouWillLearn = values.whatYouWillLearn;
    if (values.isPublished !== undefined) updateData.isPublished = values.isPublished;
    if (values.isFeatured !== undefined) updateData.isFeatured = values.isFeatured;
    if (values.subtitle !== undefined) updateData.subtitle = values.subtitle;

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
            }
          }

          updateData.categoryId = category.id;
        } catch (categoryError: unknown) {
          logger.error("[COURSE_PATCH] Error handling category:", categoryError);
        }
      } else {
        updateData.categoryId = null;
      }
    }

    // Handle subcategoryId
    if (values.subcategoryId !== undefined) {
      if (values.subcategoryId) {
        try {
          const subcategory = await db.category.findUnique({
            where: { id: values.subcategoryId }
          });

          if (subcategory) {
            updateData.subcategoryId = subcategory.id;
          } else {
            logger.warn("[COURSE_PATCH] Subcategory not found:", values.subcategoryId);
          }
        } catch (subcategoryError: unknown) {
          logger.error("[COURSE_PATCH] Error handling subcategory:", subcategoryError);
        }
      } else {
        updateData.subcategoryId = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const existingCourse = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    try {
      const course = await db.course.update({
        where: {
          id: courseId,
          userId: user.id,
        },
        data: updateData,
      });

      // Audit logging - track course update for compliance
      const { ipAddress, userAgent } = getRequestMetadata(request);
      await logCourseUpdate(courseId, {
        userId: user.id,
        ipAddress,
        userAgent,
      }, {
        fieldsUpdated: Object.keys(updateData),
        previousValues: {
          title: existingCourse.title,
          isPublished: existingCourse.isPublished,
        },
        newValues: {
          title: updateData.title ?? existingCourse.title,
          isPublished: updateData.isPublished ?? existingCourse.isPublished,
        },
      }).catch(err => {
        logger.warn("[COURSE_PATCH] Audit logging failed", { error: err });
      });

      // Queue memory lifecycle reindex for updated course content
      await queueCourseReindex(courseId, 'update').catch(err => {
        logger.warn("[COURSE_PATCH] Memory reindex queue failed", { error: err });
      });

      return NextResponse.json(course);
    } catch (dbError: unknown) {
      const message = dbError instanceof Error ? dbError.message : "Unknown database error";
      logger.error("[COURSE_PATCH] Database error during update:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error: unknown) {
    logger.error("[COURSE_PATCH] Detailed error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}