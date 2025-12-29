/**
 * Free Course Enrollment API - Enterprise Implementation
 * Creates enrollment directly in database for immediate feedback
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Validation schema
const enrollmentSchema = z.object({
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in to enroll" } },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json().catch(() => ({}));
    const validatedData = enrollmentSchema.parse(body);

    // Check if course exists and is free
    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: {
        id: true,
        title: true,
        isFree: true,
        price: true,
        isPublished: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Course not found" } },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Course is not published" } },
        { status: 403 }
      );
    }

    // Check if course is truly free
    if (!course.isFree && (course.price ?? 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PAYMENT_REQUIRED",
            message: "This course requires payment. Please use the checkout endpoint.",
            details: { price: course.price },
          },
        },
        { status: 402 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_ENROLLED",
            message: "You are already enrolled in this course",
            details: { enrollmentId: existingEnrollment.id },
          },
        },
        { status: 409 }
      );
    }

    // Create enrollment directly in database
    const enrollment = await db.enrollment.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        courseId: params.courseId,
        status: "ACTIVE",
        enrollmentType: "FREE",
        updatedAt: new Date(),
      },
    });

    logger.info(`[COURSE_ENROLL] Successfully enrolled user ${user.id} in course ${params.courseId}`);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Successfully enrolled in course",
          enrollmentId: enrollment.id,
          courseId: course.id,
          courseTitle: course.title,
          userId: user.id,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          version: "1.0.0",
        },
      },
      { status: 201 } // Created - enrollment successful
    );
  } catch (error) {
    logger.error("[COURSE_ENROLL]", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/courses/[courseId]/enroll
 * Check enrollment status
 */
export async function GET(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in" } },
        { status: 401 }
      );
    }

    // Check enrollment status
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
      select: {
        id: true,
        status: true,
        enrollmentType: true,
        createdAt: true,
        Course: {
          select: {
            id: true,
            title: true,
            isFree: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          success: true,
          data: {
            isEnrolled: false,
            courseId: params.courseId,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          isEnrolled: true,
          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            type: enrollment.enrollmentType,
            enrolledAt: enrollment.createdAt,
            course: enrollment.Course,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("[ENROLL_STATUS_API]", error);

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
} 