import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    // 1. Check authentication
    const user = await currentUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validatedData = ChangePasswordSchema.parse(body);

    // 3. Get user from database with password
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, password: true },
    });

    if (!dbUser || !dbUser.password) {
      return NextResponse.json(
        { success: false, error: "User not found or no password set" },
        { status: 404 }
      );
    }

    // 4. Verify current password
    const { verifyPassword } = await import("@/lib/passwordUtils");
    const isPasswordValid = await verifyPassword(
      validatedData.currentPassword,
      dbUser.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // 5. Check if new password is different from current
    const isSamePassword = await verifyPassword(
      validatedData.newPassword,
      dbUser.password
    );

    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // 6. Hash new password
    const hashedPassword = await hash(validatedData.newPassword, 12);

    // 7. Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 8. Create audit log
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: user.id,
        entityId: user.id,
        entityType: "USER",
        context: {
          action: "PASSWORD_CHANGE",
          userEmail: user.email,
          method: "ADMIN_DASHBOARD",
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    logger.error("[ADMIN_CHANGE_PASSWORD]", error);

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
        error: "Failed to change password",
      },
      { status: 500 }
    );
  }
}
