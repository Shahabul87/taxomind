import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { AdminRole } from "@/types/admin-role";

const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character"),
  isTeacher: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    // 1. Check authentication
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Check if user is admin (from AdminAccount table)
    if (user.role !== AdminRole.ADMIN && user.role !== AdminRole.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const validatedData = CreateUserSchema.parse(body);

    // 4. Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // 5. Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // 6. Create new user
    const newUser = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        emailVerified: new Date(), // Auto-verify admin-created users
        isTeacher: validatedData.isTeacher,
        teacherActivatedAt: validatedData.isTeacher ? new Date() : null,
      },
    });

    // 7. Create audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        userId: user.id,
        entityId: newUser.id,
        entityType: "USER",
        context: {
          createdBy: user.email,
          newUserEmail: newUser.email,
          newUserType: newUser.isTeacher ? "Teacher" : "User",
          method: "ADMIN_DASHBOARD",
          timestamp: new Date().toISOString(),
        },
      },
    });

    // 8. Return success response (don't return password)
    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isTeacher: newUser.isTeacher,
        createdAt: newUser.createdAt,
      },
      message: `${validatedData.isTeacher ? "Teacher" : "User"} created successfully`,
    });

  } catch (error) {
    console.error("[ADMIN_CREATE_USER]", error);

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
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
