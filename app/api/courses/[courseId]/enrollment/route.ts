import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { courseId } = resolvedParams;
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get session_id from query params for fallback enrollment creation
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    // Verify enrollment exists with retry logic for webhook delays
    let enrollment = null;
    let retryCount = 0;
    const maxRetries = 5;

    while (!enrollment && retryCount < maxRetries) {
      enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
        include: {
          Course: {
            include: {
              chapters: {
                where: { isPublished: true },
                include: {
                  sections: {
                    where: { isPublished: true },
                    select: { id: true },
                  },
                },
                orderBy: { position: "asc" },
              },
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
              _count: {
                select: { Enrollment: true },
              },
            },
          },
        },
      });

      if (!enrollment) {
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // Fallback: If enrollment not found but we have session_id, verify payment and create enrollment
    if (!enrollment && sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (
          session.payment_status === "paid" &&
          session.metadata?.courseId === courseId
        ) {
          const course = await db.course.findUnique({
            where: { id: courseId },
            include: {
              chapters: {
                where: { isPublished: true },
                include: {
                  sections: {
                    where: { isPublished: true },
                    select: { id: true },
                  },
                },
                orderBy: { position: "asc" },
              },
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
              _count: {
                select: { Enrollment: true },
              },
            },
          });

          if (course) {
            enrollment = await db.enrollment.create({
              data: {
                id: crypto.randomUUID(),
                userId: user.id,
                courseId,
                enrollmentType: "PAID",
                status: "ACTIVE",
                updatedAt: new Date(),
              },
              include: {
                Course: {
                  include: {
                    chapters: {
                      where: { isPublished: true },
                      include: {
                        sections: {
                          where: { isPublished: true },
                          select: { id: true },
                        },
                      },
                      orderBy: { position: "asc" },
                    },
                    user: {
                      select: {
                        name: true,
                        image: true,
                      },
                    },
                    _count: {
                      select: { Enrollment: true },
                    },
                  },
                },
              },
            });
          }
        }
      } catch (error) {
        logger.error("[ENROLLMENT_FALLBACK_ERROR]", error);
      }
    }

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    logger.error("[ENROLLMENT_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
