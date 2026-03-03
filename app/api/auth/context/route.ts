/**
 * API Endpoint for User Context Management
 * 
 * Handles context switching between different user capabilities
 * (student, teacher, affiliate, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { 
  getCurrentContext, 
  switchContext,
  getAvailableContextSwitches,
  getContextDashboardData
} from "@/lib/auth/context-manager";
import { UserCapability } from "@/lib/auth/capabilities";
import { z } from "zod";

// Request validation schema
const switchContextSchema = z.object({
  context: z.nativeEnum(UserCapability),
});

/**
 * GET /api/auth/context
 * Get current user context and available switches
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

    // Get current context
    const currentContext = await getCurrentContext(session.user.id);
    
    if (!currentContext) {
      return NextResponse.json(
        { error: "Failed to get user context" },
        { status: 500 }
      );
    }

    // Get available context switches
    const availableSwitches = await getAvailableContextSwitches(
      session.user.id,
      currentContext.activeCapability
    );

    // Get dashboard data for current context
    const dashboardData = await getContextDashboardData(
      session.user.id,
      currentContext.activeCapability
    );

    return NextResponse.json({
      success: true,
      data: {
        currentContext: {
          capability: currentContext.activeCapability,
          capabilities: currentContext.capabilities,
        },
        availableSwitches,
        dashboardData,
      },
    });
  } catch (error) {
    logger.error("Error fetching context", error);
    return NextResponse.json(
      { error: "Failed to fetch context" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/context
 * Switch to a different context
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
    const validation = switchContextSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { context } = validation.data;

    // Switch context
    const result = await switchContext(session.user.id, context);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to switch context" },
        { status: 400 }
      );
    }

    // Get dashboard data for new context
    const dashboardData = await getContextDashboardData(
      session.user.id,
      context
    );

    // Get available switches for new context
    const availableSwitches = await getAvailableContextSwitches(
      session.user.id,
      context
    );

    return NextResponse.json({
      success: true,
      message: `Switched to ${context} context`,
      data: {
        newContext: {
          capability: context,
          capabilities: result.context?.capabilities || [],
        },
        availableSwitches,
        dashboardData,
      },
    });
  } catch (error) {
    logger.error("Error switching context", error);
    return NextResponse.json(
      { error: "Failed to switch context" },
      { status: 500 }
    );
  }
}