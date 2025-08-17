/**
 * API Endpoint for User Capability Management
 * 
 * Handles:
 * - GET: Retrieve user capabilities
 * - POST: Grant new capabilities
 * - DELETE: Revoke capabilities
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getUserCapabilities, 
  grantCapability, 
  revokeCapability,
  getAvailableCapabilities,
  UserCapability
} from "@/lib/auth/capabilities";
import { z } from "zod";

// Request validation schemas
const grantCapabilitySchema = z.object({
  userId: z.string().optional(), // Optional, defaults to current user
  capability: z.nativeEnum(UserCapability),
});

const revokeCapabilitySchema = z.object({
  userId: z.string().optional(), // Optional, defaults to current user
  capability: z.nativeEnum(UserCapability),
  reason: z.string().optional(),
});

/**
 * GET /api/auth/capabilities
 * Get user capabilities
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get userId from query params or use current user
    const searchParams = req.nextUrl.searchParams;
    const targetUserId = searchParams.get("userId") || session.user.id;

    // Only admins can query other users' capabilities
    if (targetUserId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Cannot view other users' capabilities" },
        { status: 403 }
      );
    }

    // Get current capabilities
    const capabilities = await getUserCapabilities(targetUserId);
    
    // Get available capabilities (that can be acquired)
    const available = await getAvailableCapabilities(targetUserId);

    return NextResponse.json({
      success: true,
      data: {
        userId: targetUserId,
        currentCapabilities: capabilities,
        availableCapabilities: available,
      },
    });
  } catch (error) {
    console.error("Error fetching capabilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch capabilities" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/capabilities
 * Grant a new capability to a user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = grantCapabilitySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, capability } = validation.data;
    const targetUserId = userId || session.user.id;

    // Check permissions
    if (targetUserId !== session.user.id) {
      // Only admins can grant capabilities to other users
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: Only admins can grant capabilities to other users" },
          { status: 403 }
        );
      }
    }

    // Some capabilities might require admin approval
    const requiresAdminApproval = [
      UserCapability.MODERATOR,
      UserCapability.CONTENT_CREATOR,
    ];

    if (
      requiresAdminApproval.includes(capability) && 
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: `Capability ${capability} requires admin approval` },
        { status: 403 }
      );
    }

    // Grant the capability
    const result = await grantCapability(
      targetUserId,
      capability,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to grant capability" },
        { status: 400 }
      );
    }

    // Get updated capabilities
    const updatedCapabilities = await getUserCapabilities(targetUserId);

    return NextResponse.json({
      success: true,
      message: `Capability ${capability} granted successfully`,
      data: {
        userId: targetUserId,
        grantedCapability: capability,
        currentCapabilities: updatedCapabilities,
      },
    });
  } catch (error) {
    console.error("Error granting capability:", error);
    return NextResponse.json(
      { error: "Failed to grant capability" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/capabilities
 * Revoke a capability from a user
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = revokeCapabilitySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, capability, reason } = validation.data;
    const targetUserId = userId || session.user.id;

    // Check permissions
    if (targetUserId !== session.user.id) {
      // Only admins can revoke capabilities from other users
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: Only admins can revoke capabilities from other users" },
          { status: 403 }
        );
      }
    }

    // Users cannot revoke their own STUDENT capability
    if (capability === UserCapability.STUDENT) {
      return NextResponse.json(
        { error: "Cannot revoke STUDENT capability" },
        { status: 400 }
      );
    }

    // Revoke the capability
    const result = await revokeCapability(
      targetUserId,
      capability,
      session.user.id,
      reason
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to revoke capability" },
        { status: 400 }
      );
    }

    // Get updated capabilities
    const updatedCapabilities = await getUserCapabilities(targetUserId);

    return NextResponse.json({
      success: true,
      message: `Capability ${capability} revoked successfully`,
      data: {
        userId: targetUserId,
        revokedCapability: capability,
        currentCapabilities: updatedCapabilities,
        reason,
      },
    });
  } catch (error) {
    console.error("Error revoking capability:", error);
    return NextResponse.json(
      { error: "Failed to revoke capability" },
      { status: 500 }
    );
  }
}