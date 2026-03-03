import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// POST - Request account deletion (GDPR compliance)
export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const reason = body.reason || null;

    // Check if there's already a pending deletion request
    const existingRequest = await db.accountDeletionRequest.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['pending', 'approved'],
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending account deletion request.",
          data: {
            requestId: existingRequest.id,
            scheduledFor: existingRequest.scheduledFor,
            status: existingRequest.status,
          },
        },
        { status: 400 }
      );
    }

    // Calculate deletion date (30 days from now for grace period)
    const scheduledDeletionDate = new Date();
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);

    // Create account deletion request
    const deletionRequest = await db.accountDeletionRequest.create({
      data: {
        userId: user.id,
        reason: reason,
        status: 'pending',
        scheduledFor: scheduledDeletionDate,
      },
    });

    // In a real implementation, you would:
    // 1. Send confirmation email with cancellation link
    // 2. Schedule background job to execute deletion after 30 days
    // 3. Notify admin team for review (if required)
    // 4. Create audit trail of the deletion request

    return NextResponse.json({
      success: true,
      data: {
        requestId: deletionRequest.id,
        status: deletionRequest.status,
        scheduledFor: deletionRequest.scheduledFor,
        gracePeriodDays: 30,
        message: "Account deletion request submitted successfully. Your account will be permanently deleted in 30 days. You can cancel this request anytime before the scheduled date.",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Account deletion request error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Account deletion request failed",
      },
      { status: 500 }
    );
  }
}

// GET - Get account deletion request status
export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch deletion request for this user
    const deletionRequest = await db.accountDeletionRequest.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['pending', 'approved'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!deletionRequest) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No pending account deletion request found",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId: deletionRequest.id,
        status: deletionRequest.status,
        reason: deletionRequest.reason,
        scheduledFor: deletionRequest.scheduledFor,
        createdAt: deletionRequest.createdAt,
        daysRemaining: Math.ceil(
          (new Date(deletionRequest.scheduledFor).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
        ),
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Deletion request fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Account deletion request failed",
      },
      { status: 500 }
    );
  }
}

// DELETE - Cancel account deletion request
export async function DELETE(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the pending deletion request
    const deletionRequest = await db.accountDeletionRequest.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['pending', 'approved'],
        },
      },
    });

    if (!deletionRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "No pending account deletion request found to cancel",
        },
        { status: 404 }
      );
    }

    // Update the request status to cancelled
    await db.accountDeletionRequest.update({
      where: { id: deletionRequest.id },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Account deletion request cancelled successfully. Your account will not be deleted.",
        requestId: deletionRequest.id,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Deletion cancellation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Account deletion request failed",
      },
      { status: 500 }
    );
  }
}
