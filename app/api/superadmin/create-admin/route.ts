import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { hash } from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { adminEmailExists } from "@/data/admin";
import { safeErrorResponse } from '@/lib/api/safe-error';

const CreateAdminSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * Generate a secure random password
 * Format: 3 words + 2 digits + 1 special char
 * Example: "Falcon-River-Storm-47!"
 */
function generateSecurePassword(): string {
  const words = [
    "Alpha", "Beta", "Gamma", "Delta", "Echo", "Falcon", "Grid", "Harbor",
    "Iron", "Jazz", "Kilo", "Lima", "Metro", "Nova", "Ocean", "Pike",
    "Quest", "River", "Storm", "Tiger", "Ultra", "Victor", "Wave", "Xenon",
    "Yellow", "Zulu"
  ];

  const randomIndex = (max: number) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };
  const word1 = words[randomIndex(words.length)];
  const word2 = words[randomIndex(words.length)];
  const word3 = words[randomIndex(words.length)];
  const numbers = (randomIndex(90)) + 10; // 10-99
  const specialChars = "!@#$%&*";
  const special = specialChars[randomIndex(specialChars.length)];

  return `${word1}-${word2}-${word3}-${numbers}${special}`;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    // 1. Check authentication
    const session = await adminAuth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Check if user is SUPERADMIN
    const requestingAdmin = await db.adminAccount.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    });

    if (!requestingAdmin || requestingAdmin.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Only SUPERADMIN can create admins"
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = CreateAdminSchema.parse(body);

    // 4. Check if email already exists
    const emailExists = await adminEmailExists(validatedData.email);

    if (emailExists) {
      return NextResponse.json(
        {
          success: false,
          error: "An admin with this email already exists"
        },
        { status: 409 }
      );
    }

    // 5. Generate secure password
    const generatedPassword = generateSecurePassword();
    const hashedPassword = await hash(generatedPassword, 12);

    // 6. Create new admin
    const newAdmin = await db.adminAccount.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(), // Auto-verify admin-created accounts
      },
    });

    // 7. Create audit log
    await db.adminAuditLog.create({
      data: {
        userId: session.user.id,
        adminAccountId: session.user.id,
        action: "ADMIN_CREATED",
        actionCategory: "USER_MANAGEMENT",
        resource: "AdminAccount",
        resourceId: newAdmin.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        success: true,
        metadata: {
          createdBy: requestingAdmin.email,
          newAdminEmail: newAdmin.email,
          newAdminRole: newAdmin.role,
          method: "SUPERADMIN_DASHBOARD",
          timestamp: new Date().toISOString(),
        },
      },
    });

    // 8. Return success with generated password
    return NextResponse.json({
      success: true,
      data: {
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          role: newAdmin.role,
          createdAt: newAdmin.createdAt,
        },
        credentials: {
          email: newAdmin.email,
          password: generatedPassword, // IMPORTANT: Only show this once!
        },
      },
      message: "Admin created successfully. Please save the password and provide it to the admin.",
    });

  } catch (error) {
    console.error("[SUPERADMIN_CREATE_ADMIN]", error);

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
    return safeErrorResponse(error, 500, 'SUPERADMIN_CREATE_ADMIN');
  }
}
