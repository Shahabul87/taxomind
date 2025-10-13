import { NextRequest, NextResponse } from "next/server";
import { UserRole, Prisma } from "@prisma/client";
import { withRole } from "@/lib/api-protection";
import { assignRole } from "@/lib/role-management";
import { db } from "@/lib/db";
import { z } from "zod";

// Input validation schema
const GetUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["all", "USER", "ADMIN"]).optional().default("all"),
  status: z.enum(["all", "Active", "Inactive", "Suspended"]).optional().default("all"),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  sortBy: z.enum(["createdAt", "name", "email", "lastLoginAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Response type
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: "Active" | "Inactive" | "Suspended";
  joinDate: string;
  lastActive: string;
  courses: number;
  image: string | null;
  isTwoFactorEnabled: boolean;
  isAccountLocked: boolean;
  lastLoginAt: Date | null;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const GET = withRole(UserRole.ADMIN, async (request: NextRequest) => {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || "all",
      status: searchParams.get("status") || "all",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    // Validate input
    const validatedParams = GetUsersSchema.parse(params);

    // Build where clause
    const whereClause: Prisma.UserWhereInput = {};

    // Search filter
    if (validatedParams.search) {
      whereClause.OR = [
        { name: { contains: validatedParams.search, mode: "insensitive" } },
        { email: { contains: validatedParams.search, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (validatedParams.role !== "all") {
      whereClause.role = validatedParams.role;
    }

    // Status filter - map to actual database fields
    if (validatedParams.status !== "all") {
      if (validatedParams.status === "Suspended") {
        whereClause.isAccountLocked = true;
      } else if (validatedParams.status === "Active") {
        whereClause.AND = [
          { isAccountLocked: false },
          { lastLoginAt: { not: null } },
        ];
      } else if (validatedParams.status === "Inactive") {
        whereClause.AND = [
          { isAccountLocked: false },
          {
            OR: [
              { lastLoginAt: null },
              { lastLoginAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // 30 days ago
            ],
          },
        ];
      }
    }

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    const take = validatedParams.limit;

    // Get total count for pagination
    const totalCount = await db.user.count({ where: whereClause });

    // Fetch users with related data
    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        lastLoginAt: true,
        isAccountLocked: true,
        isTwoFactorEnabled: true,
        _count: {
          select: {
            courses: true,
            Enrollment: true,
          },
        },
      },
      orderBy: {
        [validatedParams.sortBy]: validatedParams.sortOrder,
      },
      skip,
      take,
    });

    // Transform data for response
    const transformedUsers: UserData[] = users.map((user) => {
      // Determine status based on account state
      let status: "Active" | "Inactive" | "Suspended" = "Inactive";
      if (user.isAccountLocked) {
        status = "Suspended";
      } else if (user.lastLoginAt) {
        const daysSinceLogin = Math.floor(
          (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        status = daysSinceLogin <= 30 ? "Active" : "Inactive";
      }

      // Format last active time
      let lastActive = "Never";
      if (user.lastLoginAt) {
        const now = new Date();
        const lastLogin = new Date(user.lastLoginAt);
        const diffMs = now.getTime() - lastLogin.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
          lastActive = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
        } else if (diffHours < 24) {
          lastActive = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
        } else if (diffDays < 30) {
          lastActive = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
        } else {
          lastActive = lastLogin.toLocaleDateString();
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status,
        joinDate: user.createdAt.toLocaleDateString(),
        lastActive,
        courses: user._count.courses + user._count.Enrollment, // Courses created + enrolled
        image: user.image,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        isAccountLocked: user.isAccountLocked,
        lastLoginAt: user.lastLoginAt,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedParams.limit);

    const response: ApiResponse<UserData[]> = {
      success: true,
      data: transformedUsers,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: "1.0.0",
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: totalCount,
          totalPages,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching users:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input parameters",
            details: error.errors,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
            version: "1.0.0",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching users",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          version: "1.0.0",
        },
      },
      { status: 500 }
    );
  }
});

export const PATCH = withRole(UserRole.ADMIN, async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { userId, role, action, data } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "User ID is required"
          }
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 }
      );
    }

    let updateData: Prisma.UserUpdateInput = {};

    // Handle role update
    if (role) {
      if (!Object.values(UserRole).includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid role"
            }
          },
          { status: 400 }
        );
      }
      await assignRole(userId, role);
      updateData.role = role;
    }

    // Handle other actions
    if (action) {
      switch (action) {
        case "update":
          // Handle full user update with data
          if (data) {
            if (data.name !== undefined) {
              updateData.name = data.name;
            }
            if (data.email !== undefined) {
              // Check if email is already taken by another user
              const existingUser = await db.user.findUnique({
                where: { email: data.email },
              });
              if (existingUser && existingUser.id !== userId) {
                return NextResponse.json(
                  {
                    success: false,
                    error: {
                      code: "VALIDATION_ERROR",
                      message: "Email already in use by another user"
                    }
                  },
                  { status: 400 }
                );
              }
              updateData.email = data.email;
            }
            if (data.role !== undefined) {
              if (!Object.values(UserRole).includes(data.role as UserRole)) {
                return NextResponse.json(
                  {
                    success: false,
                    error: {
                      code: "VALIDATION_ERROR",
                      message: "Invalid role"
                    }
                  },
                  { status: 400 }
                );
              }
              await assignRole(userId, data.role as UserRole);
              updateData.role = data.role as UserRole;
            }
          }
          break;
        case "suspend":
          updateData = {
            ...updateData,
            isAccountLocked: true,
            lockReason: "Suspended by admin",
          };
          break;
        case "activate":
          updateData = {
            ...updateData,
            isAccountLocked: false,
            lockReason: null,
            failedLoginAttempts: 0,
          };
          break;
        case "reset-password":
          // In a real app, you'd send a password reset email
          updateData = {
            ...updateData,
            passwordChangedAt: new Date(),
          };
          break;
        case "enable-2fa":
          updateData = {
            ...updateData,
            isTwoFactorEnabled: true,
          };
          break;
        case "disable-2fa":
          updateData = {
            ...updateData,
            isTwoFactorEnabled: false,
            totpEnabled: false,
            totpVerified: false,
            totpSecret: null,
          };
          break;
        case "verify-email":
          updateData = {
            ...updateData,
            emailVerified: new Date(),
          };
          break;
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAccountLocked: true,
        isTwoFactorEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: "1.0.0",
      }
    });
  } catch (error) {
    console.error("Error updating user:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update user"
        }
      },
      { status: 500 }
    );
  }
});

// DELETE endpoint for removing a user
export const DELETE = withRole(UserRole.ADMIN, async (request: NextRequest) => {
  const requestId = crypto.randomUUID();
  console.log(`[DELETE /api/admin/users] [${requestId}] Request received`);

  try {
    const body = await request.json();
    console.log(`[DELETE /api/admin/users] [${requestId}] Request body:`, {
      userId: body.userId,
      hasUserId: !!body.userId
    });

    const { userId } = body;

    if (!userId) {
      console.log(`[DELETE /api/admin/users] [${requestId}] VALIDATION_ERROR: Missing userId`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "User ID is required",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            version: "1.0.0",
          },
        },
        { status: 400 }
      );
    }

    console.log(`[DELETE /api/admin/users] [${requestId}] Fetching user from database:`, userId);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.log(`[DELETE /api/admin/users] [${requestId}] NOT_FOUND: User does not exist:`, userId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            version: "1.0.0",
          },
        },
        { status: 404 }
      );
    }

    console.log(`[DELETE /api/admin/users] [${requestId}] User found:`, {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Get current admin user from requireAuth (already called by withRole)
    const { currentUser } = await import("@/lib/auth");
    const { adminAuth } = await import("@/auth.admin");

    let currentAdminUser = await currentUser();
    if (!currentAdminUser) {
      const adminSession = await adminAuth();
      currentAdminUser = adminSession?.user || undefined;
    }

    if (!currentAdminUser) {
      console.log(`[DELETE /api/admin/users] [${requestId}] UNAUTHORIZED: Could not determine current user`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Could not determine current user",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            version: "1.0.0",
          },
        },
        { status: 401 }
      );
    }

    // Prevent self-deletion
    if (userId === currentAdminUser.id) {
      console.log(`[DELETE /api/admin/users] [${requestId}] FORBIDDEN: Admin attempting to delete themselves`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You cannot delete your own account. Please contact another administrator.",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            version: "1.0.0",
          },
        },
        { status: 403 }
      );
    }

    // Prevent deleting other admin users (optional protection)
    if (user.role === UserRole.ADMIN) {
      console.log(`[DELETE /api/admin/users] [${requestId}] FORBIDDEN: Attempting to delete admin user`);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot delete administrator accounts. Contact system administrator if this is necessary.",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
            version: "1.0.0",
          },
        },
        { status: 403 }
      );
    }

    console.log(`[DELETE /api/admin/users] [${requestId}] Proceeding with user deletion:`, userId);

    // Delete user (cascade delete will handle related records based on schema)
    await db.user.delete({
      where: { id: userId },
    });

    console.log(`[DELETE /api/admin/users] [${requestId}] User deleted successfully:`, {
      deletedUserId: userId,
      deletedBy: currentAdminUser.id,
      deletedByEmail: currentAdminUser.email
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "User deleted successfully",
        deletedUserId: userId,
        deletedUserEmail: user.email,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error(`[DELETE /api/admin/users] [${requestId}] INTERNAL_ERROR: Caught exception:`, error);
    console.error(`[DELETE /api/admin/users] [${requestId}] Error stack:`, error instanceof Error ? error.stack : "No stack trace");

    // Check for specific database errors
    let errorMessage = "An error occurred while deleting the user";
    let errorCode = "INTERNAL_ERROR";

    if (error instanceof Error) {
      // Prisma foreign key constraint error
      if (error.message.includes("Foreign key constraint")) {
        errorMessage = "Cannot delete user due to existing related records. Please delete related data first.";
        errorCode = "CONSTRAINT_ERROR";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: process.env.NODE_ENV === "development" ? {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          } : undefined
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: "1.0.0",
        },
      },
      { status: 500 }
    );
  }
});