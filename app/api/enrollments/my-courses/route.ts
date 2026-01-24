import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);
    }

    const enrollments = await db.enrollment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    const courses = enrollments
      .map((enrollment) => enrollment.Course)
      .filter((course) => course !== null);

    return successResponse(courses);
  } catch (error) {
    console.error("[MY_COURSES_GET]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch enrolled courses", HttpStatus.INTERNAL_ERROR);
  }
}
