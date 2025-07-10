import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Resolve/dismiss a progress alert
export async function PATCH(
  req: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.alertId;

    // Verify alert belongs to user
    const alert = await db.progressAlert.findFirst({
      where: {
        id: alertId,
        userId: session.user.id
      }
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    // Mark alert as resolved
    const resolvedAlert = await db.progressAlert.update({
      where: { id: alertId },
      data: {
        resolvedAt: new Date(),
        resolvedBy: session.user.id
      }
    });

    // Mark any related intervention actions as completed
    await db.interventionAction.updateMany({
      where: {
        alertId: alertId,
        completed: false
      },
      data: {
        completed: true,
        effectivenesScore: 100 // Manually resolved = effective
      }
    });

    return NextResponse.json({
      success: true,
      alert: resolvedAlert
    });

  } catch (error) {
    console.error("Resolve alert error:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 }
    );
  }
}