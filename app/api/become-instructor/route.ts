import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, apiErrors } from "@/lib/utils/api-response";
import { logger } from "@/lib/logger";

const BecomeInstructorSchema = z.object({
  expertise: z.string().min(1, "Expertise is required").max(500),
  experience: z.string().min(1, "Experience is required").max(2000),
  bio: z.string().max(2000).optional(),
  linkedIn: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  teachingGoals: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return apiErrors.unauthorized();
    }

    // Check if already a teacher
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { isTeacher: true },
    });

    if (existingUser?.isTeacher) {
      return apiErrors.badRequest("User is already an instructor");
    }

    const body = await request.json();
    const result = BecomeInstructorSchema.safeParse(body);

    if (!result.success) {
      return apiErrors.validationError({ errors: result.error.flatten().fieldErrors });
    }

    const { expertise, experience, bio, linkedIn, website, teachingGoals } = result.data;

    // Update user to become a teacher
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isTeacher: true,
        teacherActivatedAt: new Date(),
        // Store additional info in user metadata or create a separate instructor profile
        // For now, we'll just set the isTeacher flag
      },
    });

    // Create an audit log entry
    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "USER",
        entityId: user.id,
        userId: user.id,
        metadata: JSON.stringify({
          type: "BECAME_INSTRUCTOR",
          expertise,
          experience,
          bio,
          linkedIn,
          website,
          teachingGoals,
        }),
      },
    });

    return successResponse({
      message: "Successfully became an instructor",
      user: {
        id: updatedUser.id,
        isTeacher: updatedUser.isTeacher,
      },
    });
  } catch (error) {
    logger.error("Error in become-instructor API", error);
    return apiErrors.internal("Failed to process instructor application");
  }
}