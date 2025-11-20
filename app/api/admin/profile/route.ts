import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";

// Schema for updating admin profile
const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  image: z.string().url().optional().nullable(),
  socialLinks: z.object({
    website: z.string().url().optional().nullable(),
    github: z.string().optional().nullable(),
    linkedin: z.string().optional().nullable(),
    twitter: z.string().optional().nullable(),
  }).optional(),
});

// GET - Fetch current admin profile
export async function GET() {
  try {
    console.log("[ADMIN_PROFILE_GET] Starting profile fetch...");

    // 1. Check admin authentication using adminAuth
    const session = await adminAuth();
    console.log("[ADMIN_PROFILE_GET] Full session object:", JSON.stringify(session, null, 2));

    if (!session || !session.user) {
      console.log("[ADMIN_PROFILE_GET] No session or user found");
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin session required" },
        { status: 401 }
      );
    }

    const user = session.user;
    console.log("[ADMIN_PROFILE_GET] User object from session:", JSON.stringify(user, null, 2));

    // 2. Get user ID from session - handle both 'id' and 'sub' fields
    const userId = user.id || (user as any).sub;
    console.log("[ADMIN_PROFILE_GET] User ID:", userId);

    if (!userId) {
      console.log("[ADMIN_PROFILE_GET] No user ID in session");
      return NextResponse.json(
        { success: false, error: "Invalid session - No user ID" },
        { status: 401 }
      );
    }

    // 3. Check if user is admin or superadmin
    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      console.log("[ADMIN_PROFILE_GET] User is not admin:", user.role);
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // 4. Fetch full admin profile from database
    console.log("[ADMIN_PROFILE_GET] Fetching profile for admin ID:", userId);
    const adminProfile = await db.adminAccount.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        department: true,
        bio: true,
        createdAt: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
        _count: {
          select: {
            auditLogs: true,
          },
        },
      },
    });

    if (!adminProfile) {
      return NextResponse.json(
        { success: false, error: "Admin profile not found" },
        { status: 404 }
      );
    }

    // 4. Return profile data
    return NextResponse.json({
      success: true,
      data: {
        ...adminProfile,
        joinDate: adminProfile.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        lastLogin: "Recently", // AdminAccount doesn't have lastLoginAt yet
        totalActions: adminProfile._count.auditLogs,
      },
    });
  } catch (error) {
    console.error("[ADMIN_PROFILE_GET] Unexpected error:", error);
    console.error("[ADMIN_PROFILE_GET] Error stack:", error instanceof Error ? error.stack : "No stack");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admin profile",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error?.constructor?.name || "Unknown",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update admin profile
export async function PATCH(req: Request) {
  try {
    // 1. Check admin authentication using adminAuth
    const session = await adminAuth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin session required" },
        { status: 401 }
      );
    }

    const user = session.user;

    // 2. Get user ID from session - handle both 'id' and 'sub' fields
    const userId = user.id || (user as any).sub;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid session - No user ID" },
        { status: 401 }
      );
    }

    // 3. Check if user is admin or superadmin
    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await req.json();
    const validatedData = UpdateProfileSchema.parse(body);

    // 5. Check if email is being changed and if it's already in use
    if (validatedData.email && validatedData.email !== user.email) {
      const existingAdmin = await db.adminAccount.findUnique({
        where: { email: validatedData.email },
      });

      if (existingAdmin) {
        return NextResponse.json(
          { success: false, error: "Email already in use by another admin account" },
          { status: 409 }
        );
      }
    }

    // 6. Update admin profile
    const updatedProfile = await db.adminAccount.update({
      where: { id: userId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
        ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
        ...(validatedData.image !== undefined && { image: validatedData.image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        department: true,
        bio: true,
      },
    });

    // 7. Create audit log
    await db.adminAuditLog.create({
      data: {
        adminId: userId,
        action: "PROFILE_UPDATED",
        actionCategory: "CONFIGURATION",
        resource: "AdminAccount",
        resourceId: userId,
        ipAddress: "unknown",
        userAgent: "unknown",
        success: true,
        metadata: {
          updatedBy: user.email,
          updatedFields: Object.keys(validatedData),
          method: "PROFILE_UPDATE",
          timestamp: new Date().toISOString(),
        },
      },
    });

    // 7. Return success response
    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("[ADMIN_PROFILE_PATCH]", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
