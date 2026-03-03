import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is already a teacher
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isTeacher: true }
    });

    if (existingUser?.isTeacher) {
      return NextResponse.json(
        { success: false, error: "User is already a teacher" },
        { status: 400 }
      );
    }

    // Update user to become a teacher
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isTeacher: true,
        teacherActivatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        isTeacher: updatedUser.isTeacher,
        teacherActivatedAt: updatedUser.teacherActivatedAt
      }
    });
  } catch (error) {
    logger.error("[BECOME_TEACHER_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}