import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  differenceInDays,
} from "date-fns";

const querySchema = z.object({
  weeks: z.coerce.number().min(1).max(12).default(4),
});

// Course colors palette
const COURSE_COLORS = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

function getCourseColor(index: number): string {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

function calculateStatus(
  plannedProgress: number,
  actualProgress: number,
  plannedEnd: Date
): string {
  const now = new Date();
  const isPastDeadline = plannedEnd < now;

  if (actualProgress >= 100) return "COMPLETED";
  if (isPastDeadline && actualProgress < 100) return "OVERDUE";
  if (actualProgress >= plannedProgress + 10) return "AHEAD";
  if (actualProgress <= plannedProgress - 10) return "BEHIND";
  return "ON_TRACK";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { courseId } = await params;
    const { searchParams } = new URL(req.url);
    const queryParams = querySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    // Verify user has enrollment in this course
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
      },
    });

    if (!enrollment) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You are not enrolled in this course",
        HttpStatus.FORBIDDEN
      );
    }

    // Fetch course with chapters and sections (using actual schema relations)
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: "asc" },
          include: {
            sections: {
              orderBy: { position: "asc" },
            },
          },
        },
      },
    });

    if (!course) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Course not found",
        HttpStatus.NOT_FOUND
      );
    }

    // Fetch user progress for this course
    const userProgress = await db.user_progress.findMany({
      where: {
        userId: user.id,
        courseId,
      },
      take: 200,
    });

    const completedSectionIds = new Set(
      userProgress.filter((p) => p.isCompleted).map((p) => p.sectionId)
    );

    // Calculate date range
    const enrolledAt = enrollment.createdAt || new Date();
    const weekStart = startOfWeek(enrolledAt, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(addWeeks(weekStart, queryParams.weeks - 1), {
      weekStartsOn: 0,
    });

    // Calculate course statistics
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    const completedSections = course.chapters.reduce(
      (sum, ch) =>
        sum +
        ch.sections.filter((s) => completedSectionIds.has(s.id)).length,
      0
    );

    const totalProgress =
      totalSections > 0
        ? Math.round((completedSections / totalSections) * 100)
        : 0;

    // Build course info
    const courseInfo = {
      id: course.id,
      title: course.title,
      color: getCourseColor(0),
      totalProgress,
      totalHours: Math.ceil(totalSections * 0.5), // Estimate 30 min per section
      completedHours: Math.ceil(completedSections * 0.5),
      chaptersCount: course.chapters.length,
      sectionsCount: totalSections,
    };

    // Build chapter Gantt items
    const chapters = course.chapters.map((chapter, chapterIndex) => {
      const chapterSections = chapter.sections.length;
      const chapterCompletedSections = chapter.sections.filter((s) =>
        completedSectionIds.has(s.id)
      ).length;
      const chapterProgress =
        chapterSections > 0
          ? Math.round((chapterCompletedSections / chapterSections) * 100)
          : 0;

      // Estimate chapter timeline based on position
      const chapterDuration = Math.ceil(chapterSections * 0.5); // days
      const chapterStartOffset = course.chapters.slice(0, chapterIndex).reduce(
        (sum, ch) => sum + Math.ceil(ch.sections.length * 0.5),
        0
      );

      const plannedStart = new Date(enrolledAt);
      plannedStart.setDate(plannedStart.getDate() + chapterStartOffset);
      const plannedEnd = new Date(plannedStart);
      plannedEnd.setDate(plannedEnd.getDate() + chapterDuration);

      // Calculate expected progress based on time
      const totalDays = differenceInDays(plannedEnd, plannedStart) || 1;
      const elapsedDays = Math.max(
        0,
        differenceInDays(new Date(), plannedStart)
      );
      const expectedProgress = Math.min(
        100,
        Math.round((elapsedDays / totalDays) * 100)
      );

      // Build section children
      const sectionItems = chapter.sections.map((section, sectionIndex) => {
        const sectionCompleted = completedSectionIds.has(section.id);
        const sectionProgress = sectionCompleted ? 100 : 0;

        const sectionStartOffset = sectionIndex * 0.5;
        const sectionStart = new Date(plannedStart);
        sectionStart.setDate(sectionStart.getDate() + sectionStartOffset);
        const sectionEnd = new Date(sectionStart);
        sectionEnd.setDate(sectionEnd.getDate() + 0.5);

        return {
          id: `section-${section.id}`,
          type: "SECTION" as const,
          title: section.title,
          description: section.description || undefined,
          plannedStart: sectionStart,
          plannedEnd: sectionEnd,
          actualStart: sectionCompleted ? sectionStart : undefined,
          actualEnd: sectionCompleted ? sectionEnd : undefined,
          plannedHours: 0.5,
          actualHours: sectionCompleted ? 0.5 : 0,
          plannedProgress: 100,
          actualProgress: sectionProgress,
          color: getCourseColor(chapterIndex),
          status: calculateStatus(100, sectionProgress, sectionEnd),
          courseId: course.id,
          courseName: course.title,
          chapterId: chapter.id,
          chapterName: chapter.title,
          parentId: `chapter-${chapter.id}`,
          milestones: [],
        };
      });

      return {
        id: `chapter-${chapter.id}`,
        type: "CHAPTER" as const,
        title: chapter.title,
        description: chapter.description || undefined,
        plannedStart,
        plannedEnd,
        actualStart:
          chapterCompletedSections > 0 ? plannedStart : undefined,
        actualEnd:
          chapterProgress === 100 ? plannedEnd : undefined,
        plannedHours: chapterDuration,
        actualHours: chapterCompletedSections * 0.5,
        plannedProgress: expectedProgress,
        actualProgress: chapterProgress,
        color: getCourseColor(chapterIndex),
        status: calculateStatus(expectedProgress, chapterProgress, plannedEnd),
        courseId: course.id,
        courseName: course.title,
        milestones: [],
        children: sectionItems,
        depth: 0,
        isExpanded: false,
      };
    });

    // Calculate overall timeline
    const courseStartDate = enrolledAt;
    const estimatedDays = Math.ceil(totalSections * 0.5);
    const plannedCompletionDate = new Date(courseStartDate);
    plannedCompletionDate.setDate(
      plannedCompletionDate.getDate() + estimatedDays
    );

    // Estimate completion based on current progress rate
    const daysSinceStart = Math.max(
      1,
      differenceInDays(new Date(), courseStartDate)
    );
    const progressPerDay = totalProgress / daysSinceStart;
    const remainingProgress = 100 - totalProgress;
    const estimatedDaysToComplete =
      progressPerDay > 0 ? Math.ceil(remainingProgress / progressPerDay) : 30;
    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(
      estimatedCompletionDate.getDate() + estimatedDaysToComplete
    );

    return successResponse({
      course: courseInfo,
      chapters,
      milestones: [],
      timeline: {
        start: courseStartDate,
        end: weekEnd,
        plannedCompletionDate,
        estimatedCompletionDate:
          totalProgress === 100
            ? plannedCompletionDate
            : estimatedCompletionDate,
      },
      enrollment: {
        enrolledAt,
        lastAccessedAt: enrollment.updatedAt,
        status: enrollment.status,
      },
    });
  } catch (error) {
    logger.error("[GANTT_COURSE_GET]", error);

    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch course gantt data",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
