import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { queueSectionReindex } from '@/lib/sam/memory-lifecycle-service';

// Force Node.js runtime
export const runtime = 'nodejs';

// Enterprise-grade validation schema for section updates
const SectionUpdateSchema = z.object({
  // Core content fields
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less").optional(),
  description: z.string().max(30000, "Description must be 30000 characters or less").optional().nullable(),
  learningObjectives: z.string().max(2000, "Learning objectives must be 2000 characters or less").optional().nullable(),
  creatorGuidelines: z.string().max(50000, "Creator guidelines must be 50000 characters or less").optional().nullable(),

  // Video content
  videoUrl: z.string().url("Invalid URL format").optional().nullable().or(z.literal("")),

  // Metadata
  position: z.number().int("Position must be an integer").min(0, "Position must be non-negative").optional(),
  duration: z.number().int("Duration must be an integer").min(0, "Duration must be non-negative").optional().nullable(),
  // Allow estimatedDuration as alias for duration (AI generators use this field name)
  estimatedDuration: z.union([z.string(), z.number()]).optional().nullable(),
  type: z.string().max(50, "Type must be 50 characters or less").optional().nullable(),
  // Allow contentType as alias for type (AI generators use this field name)
  contentType: z.string().max(50).optional().nullable(),

  // Access control
  isFree: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isPreview: z.boolean().optional().nullable(),

  // Status
  completionStatus: z.string().max(50, "Completion status must be 50 characters or less").optional().nullable(),
  resourceUrls: z.string().optional().nullable(),
}); // Removed .strict() to allow AI-generated fields that get mapped

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    // Parse and validate request body
    const rawValues = await req.json();
    const values = SectionUpdateSchema.parse(rawValues);

    // Verify the course exists and belongs to the user
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found or you do not have permission to access it'
        }
      }, { status: 404 });
    }

    // Explicit field mapping to prevent mass assignment attacks
    const updateData: Record<string, unknown> = {};

    if (values.title !== undefined) updateData.title = values.title;
    if (values.description !== undefined) updateData.description = values.description;
    if (values.learningObjectives !== undefined) updateData.learningObjectives = values.learningObjectives;
    if (values.creatorGuidelines !== undefined) updateData.creatorGuidelines = values.creatorGuidelines;
    if (values.videoUrl !== undefined) updateData.videoUrl = values.videoUrl === "" ? null : values.videoUrl;
    if (values.position !== undefined) updateData.position = values.position;

    // Handle duration - prefer direct duration, fallback to estimatedDuration
    if (values.duration !== undefined) {
      updateData.duration = values.duration;
    } else if (values.estimatedDuration !== undefined && values.estimatedDuration !== null) {
      // Convert estimatedDuration string/number to minutes integer
      if (typeof values.estimatedDuration === 'number') {
        updateData.duration = values.estimatedDuration;
      } else if (typeof values.estimatedDuration === 'string') {
        const match = values.estimatedDuration.match(/(\d+)/);
        if (match) {
          updateData.duration = parseInt(match[1], 10);
        }
      }
    }

    // Handle type - prefer direct type, fallback to contentType
    if (values.type !== undefined) {
      updateData.type = values.type;
    } else if (values.contentType !== undefined) {
      updateData.type = values.contentType;
    }

    if (values.isFree !== undefined) updateData.isFree = values.isFree;
    if (values.isPublished !== undefined) updateData.isPublished = values.isPublished;
    if (values.isPreview !== undefined) updateData.isPreview = values.isPreview;
    if (values.completionStatus !== undefined) updateData.completionStatus = values.completionStatus;
    if (values.resourceUrls !== undefined) updateData.resourceUrls = values.resourceUrls;

    // Update the section with validated and mapped data
    const section = await db.section.update({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      data: updateData,
    });

    // Queue memory lifecycle reindex for updated section content
    await queueSectionReindex(params.sectionId, params.courseId, 'update').catch(err => {
      logger.warn("[SECTION_PATCH] Memory reindex queue failed", { error: err });
    });

    // Return standard API response format
    return NextResponse.json({
      success: true,
      data: section,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.error("[SECTION_UPDATE_VALIDATION_ERROR]:", error.errors);
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      }, { status: 400 });
    }

    // Handle database errors
    logger.error("[SECTION_UPDATE_ERROR]:", error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating the section'
      }
    }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    // Verify the course exists and belongs to the user
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found or you do not have permission to access it'
        }
      }, { status: 404 });
    }

    // Fetch the section
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      include: {
        chapter: {
          select: {
            title: true,
            course: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    if (!section) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Section not found'
        }
      }, { status: 404 });
    }

    // Return standard API response format
    return NextResponse.json({
      success: true,
      data: section,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    logger.error("[SECTION_GET_ERROR]:", error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching the section'
      }
    }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      }
    });

    if (!courseOwner) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to delete this section'
        }
      }, { status: 401 });
    }

    // Delete the section
    const deletedSection = await db.section.delete({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId
      }
    });

    // Queue memory lifecycle reindex for deleted section content
    await queueSectionReindex(params.sectionId, params.courseId, 'delete').catch(err => {
      logger.warn("[SECTION_DELETE] Memory reindex queue failed", { error: err });
    });

    // Return standard API response format
    return NextResponse.json({
      success: true,
      data: deletedSection,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    logger.error("[SECTION_DELETE_ERROR]:", error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting the section'
      }
    }, { status: 500 });
  }
} 