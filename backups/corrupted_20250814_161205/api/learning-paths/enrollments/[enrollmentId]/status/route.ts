import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enrollmentId } = await params;
    const { status } = await req.json();

    if (!["ACTIVE", "PAUSED", "COMPLETED", "ABANDONED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Verify enrollment belongs to user
    const enrollment = await db.pathEnrollment.findFirst({
      where: {
        id: enrollmentId,
        userId: session.user.id,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Update enrollment status
    const updatedEnrollment = await db.pathEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      enrollment: updatedEnrollment,
    });
  } catch (error: any) {
    logger.error("Update enrollment status error:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment status" },
      { status: 500 }
    );
  }
}