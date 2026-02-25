import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * GET /api/messages/courses
 *
 * Get all courses where user is enrolled or is the instructor,
 * including participants (instructor and other learners)
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get courses where user is enrolled (as student)
    const enrolledCourses = await db.course.findMany({
      where: {
        Enrollment: {
          some: {
            userId: userId,
          },
        },
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        Enrollment: {
          where: {
            userId: {
              not: userId, // Exclude current user
            },
          },
          select: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        title: "asc",
      },
      take: 50,
    });

    // Get courses where user is the instructor
    const createdCourses = await db.course.findMany({
      where: {
        userId: userId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        Enrollment: {
          select: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        title: "asc",
      },
      take: 50,
    });

    // Format the response
    const formattedEnrolledCourses = enrolledCourses.map((course) => ({
      id: course.id,
      title: course.title,
      imageUrl: course.imageUrl,
      role: "STUDENT" as const,
      instructor: course.user,
      participants: [
        course.user, // Instructor
        ...course.Enrollment.map((e) => e.User), // Other learners
      ],
    }));

    const formattedCreatedCourses = createdCourses.map((course) => ({
      id: course.id,
      title: course.title,
      imageUrl: course.imageUrl,
      role: "INSTRUCTOR" as const,
      instructor: course.user,
      participants: course.Enrollment.map((e) => e.User), // All learners
    }));

    return NextResponse.json({
      enrolledCourses: formattedEnrolledCourses,
      createdCourses: formattedCreatedCourses,
      total: formattedEnrolledCourses.length + formattedCreatedCourses.length,
    });
  } catch (error) {
    console.error("[MESSAGES_COURSES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
