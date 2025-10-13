import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if already a teacher
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isTeacher: true },
    });

    if (existingUser?.isTeacher) {
      return NextResponse.json(
        { error: "User is already an instructor" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { expertise, experience, bio, linkedIn, website, teachingGoals } = body;

    // Update user to become a teacher
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isTeacher: true,
        teacherActivatedAt: new Date(),
        // Store additional info in user metadata or create a separate instructor profile
        // For now, we'll just set the isTeacher flag
      },
    });

    // Create an audit log entry
    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "USER",
        entityId: user.id,
        userId: user.id,
        metadata: JSON.stringify({
          type: "BECAME_INSTRUCTOR",
          expertise,
          experience,
          bio,
          linkedIn,
          website,
          teachingGoals,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully became an instructor",
      user: {
        id: updatedUser.id,
        isTeacher: updatedUser.isTeacher,
      },
    });
  } catch (error) {
    console.error("Error in become-instructor API:", error);
    return NextResponse.json(
      { error: "Failed to process instructor application" },
      { status: 500 }
    );
  }
}