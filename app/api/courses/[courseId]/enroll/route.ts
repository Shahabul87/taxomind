import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
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
      return new NextResponse("Already enrolled", { status: 400 });
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        courseId: params.courseId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    logger.error("[COURSE_ENROLL]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 