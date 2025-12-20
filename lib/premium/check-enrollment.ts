/**
 * Course Enrollment Check Utilities
 *
 * This module provides functions to check if a user is enrolled in a course
 * and can access course content (videos, materials, etc.)
 */

import { db } from "@/lib/db";

export interface EnrollmentStatus {
  isEnrolled: boolean;
  enrollmentId: string | null;
  status: string | null;
  enrollmentType: string | null;
  enrolledAt: Date | null;
}

export interface ContentAccessResult {
  canAccess: boolean;
  reason: string;
  requiresPurchase: boolean;
  isFreeContent: boolean;
}

/**
 * Check if a user is enrolled in a course
 */
export async function checkEnrollment(
  userId: string,
  courseId: string
): Promise<EnrollmentStatus> {
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    select: {
      id: true,
      status: true,
      enrollmentType: true,
      createdAt: true,
    },
  });

  if (!enrollment) {
    return {
      isEnrolled: false,
      enrollmentId: null,
      status: null,
      enrollmentType: null,
      enrolledAt: null,
    };
  }

  return {
    isEnrolled: true,
    enrollmentId: enrollment.id,
    status: enrollment.status,
    enrollmentType: enrollment.enrollmentType,
    enrolledAt: enrollment.createdAt,
  };
}

/**
 * Quick check - returns just boolean
 */
export async function isEnrolled(
  userId: string,
  courseId: string
): Promise<boolean> {
  const status = await checkEnrollment(userId, courseId);
  return status.isEnrolled;
}

/**
 * Check if user can access a specific section's content
 * Takes into account:
 * - Section's isFree flag
 * - User's enrollment in the course
 * - Course instructor (always has access)
 */
export async function canAccessSectionContent(
  userId: string,
  sectionId: string
): Promise<ContentAccessResult> {
  // Get section with course info
  const section = await db.section.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      isFree: true,
      isPublished: true,
      chapter: {
        select: {
          isFree: true,
          course: {
            select: {
              id: true,
              userId: true, // Course instructor
              isFree: true,
            },
          },
        },
      },
    },
  });

  if (!section) {
    return {
      canAccess: false,
      reason: "Section not found",
      requiresPurchase: false,
      isFreeContent: false,
    };
  }

  if (!section.isPublished) {
    return {
      canAccess: false,
      reason: "Section is not published",
      requiresPurchase: false,
      isFreeContent: false,
    };
  }

  const course = section.chapter?.course;
  if (!course) {
    return {
      canAccess: false,
      reason: "Course not found",
      requiresPurchase: false,
      isFreeContent: false,
    };
  }

  // Course instructor always has access
  if (course.userId === userId) {
    return {
      canAccess: true,
      reason: "You are the course instructor",
      requiresPurchase: false,
      isFreeContent: true,
    };
  }

  // Check if section or chapter is free
  const isFreeSection = section.isFree;
  const isFreeChapter = section.chapter?.isFree;
  const isFreeCourse = course.isFree;

  if (isFreeSection || isFreeChapter || isFreeCourse) {
    return {
      canAccess: true,
      reason: "Free content",
      requiresPurchase: false,
      isFreeContent: true,
    };
  }

  // Check enrollment for paid content
  const enrollment = await checkEnrollment(userId, course.id);

  if (enrollment.isEnrolled) {
    return {
      canAccess: true,
      reason: "You are enrolled in this course",
      requiresPurchase: false,
      isFreeContent: false,
    };
  }

  return {
    canAccess: false,
    reason: "Please enroll in this course to access this content",
    requiresPurchase: true,
    isFreeContent: false,
  };
}

/**
 * Get YouTube video ID only if user has access
 * Returns null if user doesn't have access
 */
export async function getProtectedVideoUrl(
  userId: string,
  sectionId: string
): Promise<{
  videoUrl: string | null;
  youtubeId: string | null;
  accessResult: ContentAccessResult;
}> {
  const accessResult = await canAccessSectionContent(userId, sectionId);

  if (!accessResult.canAccess) {
    return {
      videoUrl: null,
      youtubeId: null,
      accessResult,
    };
  }

  // Get the video URL
  const section = await db.section.findUnique({
    where: { id: sectionId },
    select: {
      videoUrl: true,
    },
  });

  if (!section?.videoUrl) {
    return {
      videoUrl: null,
      youtubeId: null,
      accessResult: {
        ...accessResult,
        reason: "No video available for this section",
      },
    };
  }

  const youtubeId = extractYouTubeId(section.videoUrl);

  return {
    videoUrl: section.videoUrl,
    youtubeId,
    accessResult,
  };
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Already just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Various YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check access to multiple sections at once (for course overview)
 */
export async function checkMultipleSectionAccess(
  userId: string,
  sectionIds: string[]
): Promise<Map<string, ContentAccessResult>> {
  const results = new Map<string, ContentAccessResult>();

  // Process in parallel for efficiency
  const checks = sectionIds.map(async (sectionId) => {
    const result = await canAccessSectionContent(userId, sectionId);
    return { sectionId, result };
  });

  const resolved = await Promise.all(checks);

  for (const { sectionId, result } of resolved) {
    results.set(sectionId, result);
  }

  return results;
}
