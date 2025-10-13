/**
 * API Endpoint for Admin Creation and Management
 * 
 * Handles various admin creation strategies:
 * - First user registration
 * - Admin invitation
 * - User promotion
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/auth.admin";
import { 
  needsInitialAdmin,
  createFirstAdmin,
  promoteToAdmin,
  demoteFromAdmin,
  createAdminInvitation,
  acceptAdminInvitation,
  getAdminStats
} from "@/lib/auth/admin-manager";
import { z } from "zod";

// Request validation schemas
const createFirstAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

const promoteUserSchema = z.object({
  userId: z.string(),
  reason: z.string().optional(),
});

const demoteAdminSchema = z.object({
  userId: z.string(),
  reason: z.string(),
});

const createInvitationSchema = z.object({
  email: z.string().email(),
  expiresInDays: z.number().min(1).max(30).optional(),
});

const acceptInvitationSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

/**
 * GET /api/admin/create
 * Check if system needs initial admin and get admin stats
 */
export async function GET(req: NextRequest) {
  try {
    const session = await adminAuth();
    
    // Check if system needs initial admin (public check)
    const needsAdmin = await needsInitialAdmin();
    
    // Admin stats require authentication
    if (session?.user?.role === "ADMIN") {
      const stats = await getAdminStats();
      
      return NextResponse.json({
        success: true,
        data: {
          needsInitialAdmin: needsAdmin,
          stats,
        },
      });
    }

    // Non-admins only get basic info
    return NextResponse.json({
      success: true,
      data: {
        needsInitialAdmin: needsAdmin,
      },
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/create
 * Create first admin or handle admin operations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "CREATE_FIRST_ADMIN":
        return handleCreateFirstAdmin(body);
      
      case "PROMOTE_USER":
        return handlePromoteUser(req, body);
      
      case "DEMOTE_ADMIN":
        return handleDemoteAdmin(req, body);
      
      case "CREATE_INVITATION":
        return handleCreateInvitation(req, body);
      
      case "ACCEPT_INVITATION":
        return handleAcceptInvitation(body);
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in admin operation:", error);
    return NextResponse.json(
      { error: "Failed to perform admin operation" },
      { status: 500 }
    );
  }
}

/**
 * Handle first admin creation (no auth required)
 */
async function handleCreateFirstAdmin(body: any) {
  // Check if we already have an admin
  const hasAdmin = !(await needsInitialAdmin());
  if (hasAdmin) {
    return NextResponse.json(
      { error: "Admin already exists" },
      { status: 400 }
    );
  }

  const validation = createFirstAdminSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { email, name, password } = validation.data;
  const result = await createFirstAdmin(email, name, password);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to create admin" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "First admin created successfully",
    data: {
      email,
      name,
    },
  });
}

/**
 * Handle user promotion to admin (requires admin auth)
 */
async function handlePromoteUser(req: NextRequest, body: any) {
  const session = await adminAuth();
  
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized: Admin access required" },
      { status: 403 }
    );
  }

  const validation = promoteUserSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { userId, reason } = validation.data;
  const result = await promoteToAdmin(userId, session.user.id, reason);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to promote user" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "User promoted to admin successfully",
    data: {
      userId,
      promotedBy: session.user.id,
    },
  });
}

/**
 * Handle admin demotion (requires admin auth)
 */
async function handleDemoteAdmin(req: NextRequest, body: any) {
  const session = await adminAuth();
  
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized: Admin access required" },
      { status: 403 }
    );
  }

  const validation = demoteAdminSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { userId, reason } = validation.data;
  const result = await demoteFromAdmin(userId, session.user.id, reason);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to demote admin" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Admin demoted successfully",
    data: {
      userId,
      demotedBy: session.user.id,
    },
  });
}

/**
 * Handle admin invitation creation (requires admin auth)
 */
async function handleCreateInvitation(req: NextRequest, body: any) {
  const session = await adminAuth();
  
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized: Admin access required" },
      { status: 403 }
    );
  }

  const validation = createInvitationSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { email, expiresInDays } = validation.data;
  const result = await createAdminInvitation(
    email, 
    session.user.id, 
    expiresInDays
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to create invitation" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Admin invitation created successfully",
    data: {
      email,
      invitationUrl: `/auth/admin-invite?token=${result.invitation?.token}`,
      expiresAt: result.invitation?.expiresAt,
    },
  });
}

/**
 * Handle admin invitation acceptance (no auth required)
 */
async function handleAcceptInvitation(body: any) {
  const validation = acceptInvitationSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { token, email, name, password } = validation.data;
  const result = await acceptAdminInvitation(token, email, name, password);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to accept invitation" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Admin account created successfully",
    data: {
      email,
      name,
    },
  });
}