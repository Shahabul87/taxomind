import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();
    
    if (!["VIEWED", "ACCEPTED", "REJECTED", "DEFERRED"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // Verify the recommendation belongs to the user
    const recommendation = await db.pathRecommendation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }

    // Record the interaction
    const interaction = await db.recommendationInteraction.create({
      data: {
        id: randomUUID(),
        recommendationId: id,
        action,
      },
    });

    // Handle specific actions
    if (action === "ACCEPTED") {
      // Create enrollment for the learning path
      await db.pathEnrollment.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          pathId: recommendation.pathId,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });

      // Mark recommendation as inactive
      await db.pathRecommendation.update({
        where: { id },
        data: { isActive: false },
      });
    } else if (action === "REJECTED") {
      // Mark recommendation as inactive
      await db.pathRecommendation.update({
        where: { id },
        data: { isActive: false },
      });
    } else if (action === "DEFERRED") {
      // Lower the priority
      await db.pathRecommendation.update({
        where: { id },
        data: { 
          priority: Math.max(0, recommendation.priority - 10),
        },
      });
    }

    return NextResponse.json({
      success: true,
      interaction,
    });
  } catch (error) {
    logger.error("Recommendation interaction error:", error);
    return NextResponse.json(
      { error: "Failed to record interaction" },
      { status: 500 }
    );
  }
}